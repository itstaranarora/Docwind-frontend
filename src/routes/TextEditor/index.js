import { h } from "preact";
import { useEffect, useCallback, useState } from "preact/hooks";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useSocket } from "../../context";

const options = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor(props) {
  const [quill, setQuill] = useState();

  const {
    callAccepted,
    callEnded,
    leaveCall,
    callUser,
    answerCall,
    call,
    socket,
    stream,
    myAudio,
    userAudio,
  } = useSocket();

  const documentId = props.matches.id;

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const changeHandler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", changeHandler);

    return () => {
      socket.off("receive-changes", changeHandler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const changeHandler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", changeHandler);

    return () => {
      quill.off("text-change", changeHandler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: options,
      },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return (
    <div class="container" ref={wrapperRef}>
      <div class="video">
        <audio muted autoplay ref={myAudio}></audio>
        <audio autoplay ref={userAudio}></audio>
      </div>

      {call.isReceivingCall && !callAccepted && (
        <div class="notification">
          <p>Someone is calling:</p>
          <button onClick={answerCall}>Answer</button>
        </div>
      )}
      <div class="player">
        {callAccepted && !callEnded ? (
          <button onClick={leaveCall} class="stop">
            Hang Up
          </button>
        ) : (
          <button onClick={() => callUser()} class="call">
            Call
          </button>
        )}
      </div>
    </div>
  );
}
