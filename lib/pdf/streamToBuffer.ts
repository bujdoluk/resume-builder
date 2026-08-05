
// @react-pdf/renderer's pdf(...).toBuffer() resolves to a Node
// ReadableStream, not an actual Buffer, despite the method name — this
// drains it into one.
export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
