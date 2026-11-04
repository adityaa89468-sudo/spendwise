package com.adityaproductionspendwise.app;

import android.content.Intent;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private static final String TAG = "FlatHisabGoogleAuth";
    private static final String DEFAULT_CLIENT_ID = "733361691954-33lme627bg6bm5bp4i0964uaqnphu697.apps.googleusercontent.com";

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = call.getString("serverClientId", DEFAULT_CLIENT_ID);
        if (serverClientId == null || serverClientId.isEmpty()) {
            serverClientId = DEFAULT_CLIENT_ID;
        }

        try {
            GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(serverClientId)
                    .requestEmail()
                    .requestProfile();

            GoogleSignInOptions gso = builder.build();
            GoogleSignInClient googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

            // Force sign out first so the native account picker sheet always pops up with available accounts
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleSignInResult");
            });
        } catch (Exception e) {
            Log.e(TAG, "Native Google Sign-In setup error", e);
            call.reject("Failed to initialize Google Sign-In: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            Intent data = result.getData();
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            GoogleSignInAccount account = task.getResult(ApiException.class);

            if (account != null) {
                String idToken = account.getIdToken();
                if (idToken == null || idToken.isEmpty()) {
                    call.reject("Google Sign-In failed: idToken is null. Ensure serverClientId matches your Web Client ID in Firebase Console.");
                    return;
                }
                JSObject ret = new JSObject();
                ret.put("idToken", idToken);
                ret.put("email", account.getEmail());
                ret.put("displayName", account.getDisplayName());
                call.resolve(ret);
            } else {
                call.reject("Google Sign-In failed: Account is null.");
            }
        } catch (ApiException e) {
            Log.w(TAG, "Google Sign-In failed with status code: " + e.getStatusCode(), e);
            call.reject("Google Sign-In cancelled or failed (Code " + e.getStatusCode() + ")");
        } catch (Exception e) {
            Log.e(TAG, "Error handling Google Sign-In result", e);
            call.reject("Google Sign-In error: " + e.getMessage());
        }
    }
}
