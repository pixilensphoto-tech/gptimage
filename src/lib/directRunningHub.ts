import https from "node:https";
import { updateGalleryItem } from "./galleryDb";

function getEnv(key: string): string | undefined {
  const val = process.env[key];
  if (!val) return undefined;
  try {
    const decoded = Buffer.from(val, "base64").toString("utf-8");
    if (decoded.includes(":") || decoded.includes("/") || decoded.includes("https")) {
      return decoded;
    }
  } catch {}
  return val;
}

const RUNNINGHUB_API_KEY = getEnv("CODEX_API_KEY") || "a33f38bd5c254560945f71578723f6b0";
const UPSCALE_WORKFLOW_ID = process.env.RUNNINGHUB_UPSCALE_WORKFLOW_ID || "2056175041569673218";
const UPSCALE_NODE_ID = Number(process.env.RUNNINGHUB_UPSCALE_NODE_IMAGE) || 370;
const UPSCALE_FIELD_NAME = process.env.RUNNINGHUB_UPSCALE_FIELD_IMAGE || "image";
const IMGBB_API_KEY = getEnv("IMGBB_API_KEY");

async function nativePost(url: string, payload: any): Promise<any> {
  console.log(`!!!LOG!!! [rh:post] ${url}`);
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );
    req.on("error", (e) => {
      console.error(`!!!LOG!!! [rh:post] error ${url}`, e);
      reject(e);
    });
    req.write(data);
    req.end();
  });
}

export async function uploadToRunningHub(fileBuffer: Buffer, fileName: string): Promise<string> {
  console.log(`!!!LOG!!! [rh:upload] starting for ${fileName}`);
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="apiKey"\r\n\r\n${RUNNINGHUB_API_KEY}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://www.runninghub.ai/task/openapi/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": payload.length,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            if (result.code !== 0) {
               console.error(`!!!LOG!!! [rh:upload] failed code ${result.code}`, result);
               reject(new Error(JSON.stringify(result)));
            } else {
              console.log(`!!!LOG!!! [rh:upload] success: ${result.data.fileName}`);
              resolve(result.data.fileName);
            }
          } catch (e) {
            console.error(`!!!LOG!!! [rh:upload] parse error`, body);
            reject(new Error(body));
          }
        });
      }
    );
    req.on("error", (e) => {
      console.error(`!!!LOG!!! [rh:upload] request error`, e);
      reject(e);
    });
    req.write(payload);
    req.end();
  });
}

async function uploadToImgBB(imageBuffer: Buffer): Promise<{ url: string; deleteUrl?: string }> {
  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY is not configured");
  }

  const base64Image = imageBuffer.toString("base64");

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      key: IMGBB_API_KEY,
      image: base64Image,
    });

    const req = https.request(
      "https://api.imgbb.com/1/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            if (!result.success) {
              reject(new Error(result.error?.message || "ImgBB upload failed"));
            } else {
              resolve({
                url: result.data.url,
                deleteUrl: result.data.delete_url,
              });
            }
          } catch (e) {
            reject(new Error(`Failed to parse ImgBB response: ${body}`));
          }
        });
      }
    );
    req.on("error", (e) => reject(e));
    req.write(data);
    req.end();
  });
}

export async function pollRunningHubTask(galleryId: string, taskId: string) {
  const start = Date.now();
  const timeout = 10 * 60 * 1000; // 10 mins

  while (Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const res = await nativePost("https://www.runninghub.ai/task/openapi/status", {
        taskId,
        apiKey: RUNNINGHUB_API_KEY,
      });

      if (res.code !== 0) throw new Error(res.msg);
      const status = res.data;
      console.log(`!!!LOG!!! [rh:poll] ${taskId} status: ${status}`);

      if (status === "SUCCESS") {
        const outputs = await nativePost("https://www.runninghub.ai/task/openapi/outputs", {
          taskId,
          apiKey: RUNNINGHUB_API_KEY,
        });
        const rhUrl = outputs.data?.[0]?.fileUrl;
        if (!rhUrl) throw new Error("No output URL found");

        console.log(`!!!LOG!!! [rh:poll] ${taskId} success URL: ${rhUrl}`);

        // Download from RunningHub and upload to ImgBB
        await updateGalleryItem(galleryId, {
          progress: 85,
          message: "Uploading result to storage",
        });

        const imageResponse = await fetch(rhUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download result: ${imageResponse.status}`);
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const imgbbResult = await uploadToImgBB(imageBuffer);

        console.log(`!!!LOG!!! [rh:poll] ${taskId} ImgBB URL: ${imgbbResult.url}`);

        await updateGalleryItem(galleryId, {
          status: "succeeded",
          progress: 100,
          message: "Upscale complete",
          imageUrl: imgbbResult.url,
          metadata: {
            imgbb: {
              url: imgbbResult.url,
              deleteUrl: imgbbResult.deleteUrl,
            },
            runninghub: {
              taskId,
              outputUrl: rhUrl,
              workflowId: UPSCALE_WORKFLOW_ID,
            },
          },
        });
        return;
      }

      if (status === "FAILED") throw new Error("RunningHub task failed");

      await updateGalleryItem(galleryId, {
        progress: 50,
        message: `Processing: ${status}`,
      });
    } catch (e: any) {
      console.error("!!!LOG!!! [poll] error", e);
      await updateGalleryItem(galleryId, {
        status: "failed",
        progress: 100,
        message: "Upscale failed",
        error: e.message || "Unknown error",
      });
      return;
    }
  }

  await updateGalleryItem(galleryId, {
    status: "failed",
    progress: 100,
    error: "Polling timed out",
  });
}

export async function createDirectUpscaleTask(galleryId: string, rhFileName: string) {
  console.log(`!!!LOG!!! [rh:create] starting for workflow ${UPSCALE_WORKFLOW_ID}, node ${UPSCALE_NODE_ID}, field ${UPSCALE_FIELD_NAME}`);
  const res = await nativePost("https://www.runninghub.ai/task/openapi/create", {
    workflowId: UPSCALE_WORKFLOW_ID,
    apiKey: RUNNINGHUB_API_KEY,
    nodeInfoList: [{ nodeId: UPSCALE_NODE_ID, fieldName: UPSCALE_FIELD_NAME, fieldValue: rhFileName }],
  });

  if (res.code !== 0) {
    console.error(`!!!LOG!!! [rh:create] failed code ${res.code}`, res);
    throw new Error(res.msg);
  }

  const taskId = res.data.taskId;
  console.log(`!!!LOG!!! [rh:create] success taskId: ${taskId}`);
  await updateGalleryItem(galleryId, {
    status: "processing",
    progress: 40,
    message: "AI task created",
    metadata: { taskId, workflowId: UPSCALE_WORKFLOW_ID, nodeId: UPSCALE_NODE_ID },
  });

  void pollRunningHubTask(galleryId, taskId);
  return taskId;
}
