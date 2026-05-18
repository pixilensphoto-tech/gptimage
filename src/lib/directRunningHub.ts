import https from "node:https";
import { updateGalleryItem } from "./galleryDb";

const RUNNINGHUB_API_KEY = process.env.CODEX_API_KEY || "a33f38bd5c254560945f71578723f6b0";
const UPSCALE_WORKFLOW_ID = "2056175041569673218";
const UPSCALE_NODE_ID = 370;

async function nativePost(url: string, payload: any): Promise<any> {
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
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export async function uploadToRunningHub(fileBuffer: Buffer, fileName: string): Promise<string> {
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
            if (result.code !== 0) reject(new Error(JSON.stringify(result)));
            else resolve(result.data.fileName);
          } catch (e) {
            reject(new Error(body));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
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

      if (status === "SUCCESS") {
        const outputs = await nativePost("https://www.runninghub.ai/task/openapi/outputs", {
          taskId,
          apiKey: RUNNINGHUB_API_KEY,
        });
        const url = outputs.data?.[0]?.fileUrl;
        if (!url) throw new Error("No output URL found");

        await updateGalleryItem(galleryId, {
          status: "succeeded",
          progress: 100,
          message: "Upscale complete",
          imageUrl: url,
        });
        return;
      }

      if (status === "FAILED") throw new Error("RunningHub task failed");

      await updateGalleryItem(galleryId, {
        progress: 50,
        message: `Processing: ${status}`,
      });
    } catch (e: any) {
      console.error("[poll] error", e);
    }
  }

  await updateGalleryItem(galleryId, {
    status: "failed",
    progress: 100,
    error: "Polling timed out",
  });
}

export async function createDirectUpscaleTask(galleryId: string, rhFileName: string) {
  const res = await nativePost("https://www.runninghub.ai/task/openapi/create", {
    workflowId: UPSCALE_WORKFLOW_ID,
    apiKey: RUNNINGHUB_API_KEY,
    nodeInfoList: [{ nodeId: UPSCALE_NODE_ID, fieldName: "image", fieldValue: rhFileName }],
  });

  if (res.code !== 0) throw new Error(res.msg);

  const taskId = res.data.taskId;
  await updateGalleryItem(galleryId, {
    status: "processing",
    progress: 20,
    message: "AI task created",
    metadata: { taskId },
  });

  void pollRunningHubTask(galleryId, taskId);
  return taskId;
}
