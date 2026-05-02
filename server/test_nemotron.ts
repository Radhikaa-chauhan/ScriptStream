import { askAI } from "./src/utils/ai";

async function test() {
  try {
    const res = await askAI("What is in this image?", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        mimeType: "image/png"
    });
    console.log("Response:", res);
  } catch (err: any) {
    console.error("Error:", err.message);
    if (err.response) console.error(err.response.data);
  }
}

test();
