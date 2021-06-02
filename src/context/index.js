import React, { createContext } from "preact";
import { useState, useRef, useEffect, useContext } from "preact/hooks";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const useSocket = () => useContext(SocketContext);

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [socket, setSocket] = useState();
  const [stream, setStream] = useState();
  const [call, setCall] = useState({});

  const myAudio = useRef();
  const userAudio = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const s = io("https://docwind.herokuapp.com/");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!myAudio) return;
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myAudio.current.srcObject = currentStream;
      });
  }, [myAudio]);

  useEffect(() => {
    if (!socket) return;
    socket.on("callUser", ({ signal }) => {
      setCall({ isReceivingCall: true, signal });
    });
  }, [socket]);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data });
    });

    peer.on("stream", (currentStream) => {
      userAudio.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("callUser", { signalData: data });
    });

    peer.on("stream", (currentStream) => {
      console.log("callUser stream", currentStream);
      userAudio.current.srcObject = currentStream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myAudio,
        userAudio,
        stream,
        socket,
        callEnded,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, useSocket };
