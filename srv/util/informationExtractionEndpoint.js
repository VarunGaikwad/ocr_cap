const { default: axios } = require("axios"),
  clientId =
    "sb-05b51e8f-24ac-4cb7-94ba-f702bc5b37bb!b264940|dox-xsuaa-std-production!b9505",
  clientSecret =
    "d218de85-9454-4a8f-a506-ea571b8b2399$vu5keV65ppfpBv7oHq7SMTi1HduAupH965OH7WWV5Ck=",
  tokenUrl =
    "https://development-oc58dg9d.authentication.us10.hana.ondemand.com/oauth/token",
  documentClient = axios.create({
    baseURL:
      "https://aiservices-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1",
  });

let accessToken = null,
  tokenExpiryTime = null;

async function fetchDocumentExtractionAccessToken() {
  const urlParams = new URLSearchParams();
  urlParams.append("grant_type", "client_credentials");

  try {
    const {
      data: { access_token, expires_in },
    } = await axios.post(tokenUrl, urlParams.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(
          clientId + ":" + clientSecret
        ).toString("base64")}`,
      },
    });

    accessToken = access_token;

    tokenExpiryTime = Date.now() + expires_in * 1000;

    return accessToken;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

documentClient.interceptors.request.use(
  async (config) => {
    if (!accessToken || Date.now() >= tokenExpiryTime) {
      accessToken = await fetchDocumentExtractionAccessToken();
    }

    config.headers["Authorization"] = `Bearer ${accessToken}`;

    return config;
  },
  (error) => {
    console.error("Error intercepting request:", error);
    return Promise.reject(error);
  }
);

module.exports = documentClient;
