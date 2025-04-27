import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
}

function BottomToolbar({
  // sessionStatus,
  // isPTTActive,
  // setIsPTTActive,
  // isPTTUserSpeaking,
  // handleTalkButtonDown,
  // handleTalkButtonUp,
  // isAudioPlaybackEnabled,
  // setIsAudioPlaybackEnabled,
}: BottomToolbarProps) {
  // const isConnected = sessionStatus === "CONNECTED";
  // const [talking, setTalking] = React.useState(false);

  return (
    <div className="p-4 flex sm:flex-row flex-col items-center justify-center gap-x-8">
      {/* <div className="flex flex-row items-center gap-2">
        <input
          id="push-to-talk"
          type="checkbox"
          checked={isPTTActive}
          onChange={e => setIsPTTActive(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4"
        />
        <label htmlFor="push-to-talk" className="flex items-center cursor-pointer">
          Push to talk
        </label>
        <button
          onClick={() => { if (talking) { handleTalkButtonUp() } else { handleTalkButtonDown() }; setTalking(!talking); }}
          onTouchEnd={() => { if (talking) { handleTalkButtonUp() } else { handleTalkButtonDown() }; setTalking(!talking); }}
          disabled={!isPTTActive}
          className={
            (isPTTUserSpeaking ? "bg-gray-300" : "bg-gray-200") +
            " py-2 px-5 cursor-pointer rounded-full" +
            (!isPTTActive ? " bg-gray-100 text-gray-400" : "")
          }
        >
          {talking ? "Send" : "Talk"}
        </button>
      </div> */}

      {/* <div className="flex flex-row items-center gap-2">
        <input
          id="audio-playback"
          type="checkbox"
          checked={isAudioPlaybackEnabled}
          onChange={e => setIsAudioPlaybackEnabled(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4"
        />
        <label htmlFor="audio-playback" className="flex items-center cursor-pointer">
          Audio playback
        </label>
      </div> */}
      <div className="absolute right-0 mr-3 text-xs">v 1.0</div>
      {/* <div className="flex flex-row items-center gap-2">
        <input
          id="logs"
          type="checkbox"
          checked={isEventsPaneExpanded}
          onChange={e => setIsEventsPaneExpanded(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer">
          Logs
        </label>
      </div> */}
    </div>
  );
}

export default BottomToolbar;
