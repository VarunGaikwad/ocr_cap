const documentClient = require("./util/informationExtractionEndpoint");

module.exports = function (server) {
  server.on("Upload", async function (req, res) {
    const formData = new FormData(),
      {
        data: { content, name },
      } = req;

    if (!content) return 0;
    if (!name) return 0;

    const buffer = _DataURIToBlob(content);

    formData.append("file", buffer, name);
    formData.append(
      "options",
      JSON.stringify({
        schemaId: "cf8cc8a9-1eee-42d9-9a3e-507a61baac23",
        clientId: "default",
        documentType: "invoice",
        receivedDate: new Date().toISOString().split("T")[0],
      })
    );
    try {
      await documentClient.post("/document/jobs", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      });
      return 1;
    } catch (err) {
      req.reject(err);
    }
    return 0;
  });

  server.on(["Jobs", "Job"], async function (req) {
    const { event } = req;

    if (event === "Jobs") {
      const { data } = await documentClient.get(`/document/jobs`);

      return data?.results?.sort(
        (first, second) =>
          -new Date(first.created).getTime() +
          new Date(second.created).getTime()
      );
    }

    const {
        data: { ID },
      } = req,
      { data } = await documentClient.get(`/document/jobs/${ID}`);

    data.extraction.lineItems = data.extraction.lineItems.map((item, index) => {
      return {
        name: `Line Item ${index + 1}`,
        data: item,
      };
    });

    return data;
  });

  server.on("Download", async function (req) {
    const { ID } = req.data,
      { data, headers } = await documentClient.get(
        `/document/jobs/${ID}/file`,
        {
          responseType: "arraybuffer",
        }
      ),
      mimeType = headers["content-type"] || "application/octet-stream",
      base64Data = Buffer.from(data, "binary").toString("base64");

    return `data:${mimeType};base64,${base64Data}`;
  });
};

function _GetContentTypeFromBase64(base64String) {
  if (base64String.startsWith("data:")) {
    const contentType = base64String.substring(5, base64String.indexOf(";"));
    return contentType;
  }
  return null;
}

function _DataURIToBlob(dataURI) {
  const splitDataURI = dataURI.split(",");
  const byteString =
    splitDataURI[0].indexOf("base64") >= 0
      ? atob(splitDataURI[1])
      : decodeURI(splitDataURI[1]);
  const mimeString = splitDataURI[0].split(":")[1].split(";")[0];

  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

  return new Blob([ia], { type: mimeString });
}
