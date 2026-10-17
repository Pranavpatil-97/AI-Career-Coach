import { api } from "../services/api";

function messageFrom(error, fallback) {
  if (!error.response && error.request) {
    return "The API server is unavailable. Start the backend with `npm run dev` from the project root, and make sure MongoDB is configured.";
  }
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

export async function signIn(credentials) {
  try {
    const { data } = await api.post("/auth/login", credentials);
    return data.user;
  } catch (error) {
    throw new Error(messageFrom(error, "Could not reach the server. Please try again."));
  }
}

export async function signUp(details) {
  try {
    const { data } = await api.post("/auth/signup", details);
    return data.user;
  } catch (error) {
    throw new Error(messageFrom(error, "Could not reach the server. Please try again."));
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw new Error(messageFrom(error, "Could not verify your session. Please try again."));
  }
}

export async function signOut() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    throw new Error(messageFrom(error, "Could not sign out. Please try again."));
  }
}