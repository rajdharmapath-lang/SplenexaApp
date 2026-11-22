import Constants from 'expo-constants';

const REQUEST_TIMEOUT_MS = 15000;

function getApiUrl() {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl?.replace(/\/+$/, '');
  if (!apiUrl) {
    throw new Error('Question Bank API is not configured. Set EXPO_PUBLIC_API_URL in frontend/.env.');
  }
  return apiUrl;
}

export async function fetchQuestionBank() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${getApiUrl()}/api/question-bank`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(`Unable to load the Question Bank: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  let catalog;
  try {
    catalog = await response.json();
  } catch {
    throw new Error(`Question Bank API returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(catalog.message || `Question Bank API request failed (HTTP ${response.status}).`);
  }
  if (
    !catalog ||
    !Array.isArray(catalog.products) ||
    !Array.isArray(catalog.subjects) ||
    !Array.isArray(catalog.questions)
  ) {
    throw new Error('Question Bank API returned an invalid catalog.');
  }
  return catalog;
}
