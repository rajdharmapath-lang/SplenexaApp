import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SESSION_KEY = 'splenexa_session_token';
const REQUEST_TIMEOUT_MS = 15000;

function getApiUrl() {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl?.replace(/\/+$/, '');
  if (!apiUrl) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_API_URL in frontend/.env.');
  }
  return apiUrl;
}

async function request(path, { method = 'GET', body, token } = {}) {
  let response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(`Unable to reach the backend: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    const error = new Error(payload.message || `Backend request failed (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function splitPhoneNumber(phoneNumber) {
  const match = /^\+91([6-9]\d{9})$/.exec(phoneNumber);
  if (!match) {
    throw new Error('Enter a valid Indian phone number.');
  }
  return { dialCode: '91', phone: match[1] };
}

export async function getExistingSession() {
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  if (!token) {
    return null;
  }

  try {
    const user = await requestUserProfile(token);
    return { access_token: token, user };
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function requestPhoneOtp(phoneNumber) {
  const phone = splitPhoneNumber(phoneNumber);
  const { requestId } = await request('/api/auth/send-otp', {
    method: 'POST',
    body: phone,
  });
  if (typeof requestId !== 'string' || !requestId.trim()) {
    throw new Error('The backend did not return an OTP request. Please try again.');
  }
  return requestId;
}

export async function retryPhoneOtp(phoneNumber, requestId) {
  const phone = splitPhoneNumber(phoneNumber);
  const { requestId: nextRequestId } = await request('/api/auth/retry-otp', {
    method: 'POST',
    body: { ...phone, requestId },
  });
  return nextRequestId || requestId;
}

export async function verifyPhoneOtp(phoneNumber, code, requestId) {
  const phone = splitPhoneNumber(phoneNumber);
  const { token, user, isNewUser } = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: { ...phone, code, requestId },
  });
  await SecureStore.setItemAsync(SESSION_KEY, token);
  return { session: { access_token: token, user }, user, isNewUser: Boolean(isNewUser) };
}

export async function getUserProfile() {
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  if (!token) {
    throw new Error('No signed-in session is available.');
  }
  const user = await requestUserProfile(token);
  return user;
}

export async function saveUserProfile(profile) {
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  if (!token) {
    throw new Error('No signed-in session is available.');
  }
  const { user } = await request('/api/user/profile', {
    method: 'PATCH',
    body: profile,
    token,
  });
  return user;
}

async function requestUserProfile(token) {
  const { user } = await request('/api/user/me', { token });
  return user;
}

export async function signOut() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
