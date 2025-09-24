// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


export const readLines = async (file: File, count = 4): Promise<string> => {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder("utf-8");
  let { value: chunk, done: readerDone } = await reader.read();
  let content = "";
  const result: string[] = [];

  while (!readerDone) {
    content += decoder.decode(chunk, { stream: true });
    const lines = content.split("\n");
    if (lines.length >= count) {
      reader.cancel();
      return lines.slice(0, count).join("\n");
    }
    ({ value: chunk, done: readerDone } = await reader.read());
  }

  return result.join("\n");
};
