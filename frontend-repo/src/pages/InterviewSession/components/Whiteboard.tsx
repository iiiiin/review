import { Excalidraw } from "@excalidraw/excalidraw";

export default function Whiteboard() {
  return (
    <div className="w-full max-w-4xl h-[70vh] rounded shadow overflow-hidden border border-gray-200 bg-white">
      <Excalidraw theme="light" />
    </div>
  );
}
