"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// UI components
import Transcript from "../components/Transcript";
import BottomToolbar from "../components/BottomToolbar";

// Types
import { AgentConfig, SessionStatus } from "@/app/types";

// Context providers & hooks
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { EventProvider, useEvent } from "@/app/contexts/EventContext";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";

// Utilities
import { createRealtimeConnection } from "../lib/realtimeConnection";

// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
import apiService from "../lib/apiServices";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { getApiKey, getUser } from "../lib/auth";
import { useRouter } from "next/navigation";
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { SummaryModal } from '../components/SummaryModal';

import { ConversationModeModal } from '../components/ConversationModeModal';
import { SessionSurveyModal, SurveyData } from '../components/SessionSurveyModal';

function App() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = getUser();

  const { transcriptItems, addTranscriptMessage, addTranscriptBreadcrumb } =
    useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] =
    useState<AgentConfig[] | null>(null);

  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] =
    useState<boolean>(false);

  const [apiKey, setApiKey] = useState<string | null>(null);

  const [startTime] = useState<Date>(new Date());

  type ConversationMode = 'text' | 'voice';
  const [modeModalOpen, setModeModalOpen] = useState<boolean>(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>('voice');

  const [surveyModalOpen, setSurveyModalOpen] = useState<boolean>(false);
  const [isPreSession, setIsPreSession] = useState<boolean>(true);
  const [preSurveyData, setPreSurveyData] = useState<SurveyData | null>(null);

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };

  const emergencyDisconnect = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      onToggleConnection();
    }
  }

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
    disconnectFromRealtime: emergencyDisconnect,
  });

  const [previousSummaries, setPreviousSummaries] = useState<string>('');
  const [previousSessions, setPreviousSessions] = useState<number>(0);
  const [selectedSession, setSelectedSession] = useState<number>(0);

  const loadPreviousSummaries = async () => {
    if (user) {
      try {
        const { summary, sessions } = await fetchPreviousSummaries(user.uid);
        setPreviousSummaries(summary);
        setPreviousSessions(sessions);
      } catch (error) {
        console.error('Error loading previous summaries:', error);
        localStorage.clear();
        router.push('/login');
      }
    } else {
      localStorage.clear();
      router.push('/login');
    }
  };

  useEffect(() => {
    loadPreviousSummaries();
  }, [user]);

  useEffect(() => {
    let finalAgentConfig = searchParams.get("agentConfig");
    if (!finalAgentConfig || !allAgentSets[finalAgentConfig]) {
      finalAgentConfig = defaultAgentSetKey;
      // const url = new URL(window.location.toString());
      // url.searchParams.set("agentConfig", finalAgentConfig);
      // window.location.replace(url.toString());
      // return;
    }

    const agents = allAgentSets[finalAgentConfig];
    const agentKeyToUse = agents[0]?.name || "";

    setSelectedAgentName(agentKeyToUse);
    setSelectedAgentConfigSet(agents);
  }, [searchParams]);

  useEffect(() => {
    // if (selectedAgentName && sessionStatus === "DISCONNECTED") {
    //   connectToRealtime();
    // }
  }, [selectedAgentName]);

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );
      addTranscriptBreadcrumb(
        `Agent: ${selectedAgentName}`,
        currentAgent
      );
      updateSession(true);
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive]);

  const fetchPreviousSummaries = async (userId: string): Promise<{ summary: string; sessions: number }> => {
    try {
      // Query all summaries for the user, ordered by sessionNumber
      const q = query(
        collection(db, 'conversation_summaries'),
        where('userId', '==', userId),
        orderBy('sessionNumber', 'asc')
      );

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return { summary: '', sessions: 0 };
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.error('Error: Permission denied. Possible 403 Forbidden.');
          throw new Error('403 Forbidden');
        } else {
          console.error('Error fetching summaries:', error);
          throw error;
        }
      }

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return { summary: '', sessions: 0 };

      let sessions = 0;

      const summaries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date();
        const formattedDate = timestamp.toLocaleDateString();

        if (data.sessionNumber > sessions) {
          sessions = data.sessionNumber;
        }

        return `Session ${data.sessionNumber} (${formattedDate}):
${data.summary}`;
      });

      // Format the context for the AI model
      return {
        sessions, summary: `Previous Sessions History:

${summaries.join('\n\n---\n\n')}

Context Instructions:
- Session numbers indicate chronological order (1 is first, ${summaries.length} is most recent)
- Use this context to:
  1. Maintain continuity between sessions
  2. Reference specific past sessions when relevant
  3. Track progress across sessions
  4. Avoid repeating previously covered topics
  5. Build upon insights from earlier sessions
  6. Welcome them back and acknowledge their previous sessions.
  7. Do not ask for participant id if it has been provided in the previous sessions.
  8. Use their name if provided in the previous sessions.
- When referencing previous sessions, specify the session number (e.g., "As we discussed in Session 2...")`

      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }
  };

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    // const tokenResponse = await fetch("/api/session");
    // const oaKeyResponse = await apiService.getRemiOAKey('#################');
    const oaKey = getApiKey() || '';

    if (!oaKey || !user) {
      // navigate  to login page
      // clear all local storage
      localStorage.clear();
      router.push('/login');
      return null;
    }

    setApiKey(oaKey);
    const data = await apiService.getSession(oaKey);
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async (playback: boolean) => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        return;
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = playback;

      const { pc, dc } = await createRealtimeConnection(
        EPHEMERAL_KEY,
        audioElementRef
      );
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        logClientEvent({}, "data_channel.open");
      });
      dc.addEventListener("close", () => {
        logClientEvent({}, "data_channel.close");
      });
      dc.addEventListener("error", (err: any) => {
        logClientEvent({ error: err }, "data_channel.error");
      });
      dc.addEventListener("message", (e: MessageEvent) => {
        handleServerEventRef.current(JSON.parse(e.data));
      });

      setDataChannel(dc);
    } catch (err) {
      console.error("Error connecting to realtime:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    setDataChannel(null);
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);

    logClientEvent({}, "disconnected");
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)"
    );
    sendClientEvent(
      { type: "response.create" },
      "(trigger response after simulated user text message)"
    );
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendClientEvent(
      { type: "input_audio_buffer.clear" },
      "clear audio buffer on session update"
    );

    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    const turnDetection = isPTTActive
      ? null
      : {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 500,
        silence_duration_ms: 500,
        create_response: true,
      };

    console.log("selected session:", selectedSession);

    let current_session = previousSessions === 0 ? 0 : previousSessions >= 4 ? 2 : 1;

    if (selectedSession !== 0) {
      console.log("selected session: here");
      if (selectedSession == 1) {
        current_session = 0;
      } else if (selectedSession == 5) {
        current_session = 2;
      } else {
        current_session = 1;
      }
    } else {
      setSelectedSession(previousSessions < 5 ? previousSessions + 1 : 5);
    }

    console.log("Current session transcript & #:", current_session, previousSessions + 1);

    const instruction_list = currentAgent?.instructions || "";

    let instructions = instruction_list[current_session];

    if (previousSummaries && current_session > 0) {
      instructions = `\n\nPrevious Session Context:**\n${previousSummaries}\n\n${instructions}`;
    }

    //console.log("Session instructions:", instructions);

    const tools = currentAgent?.tools || [];

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: turnDetection,
        temperature: 1.0,
        max_response_output_tokens: 'inf',
        tools,
      },
    };

    sendClientEvent(sessionUpdateEvent);

    if (shouldTriggerResponse) {
      sendSimulatedUserMessage("hi");
    }
  };

  const cancelAssistantSpeech = async () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      console.warn("can't cancel, no recent assistant message found");
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      console.log("No truncation needed, message is DONE");
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAssistantMessage?.itemId,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAssistantMessage.createdAtMs,
    });
    sendClientEvent(
      { type: "response.cancel" },
      "(cancel due to user interruption)"
    );
  };

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    cancelAssistantSpeech();

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: userText.trim() }],
        },
      },
      "(send user text message)"
    );
    setUserText("");

    sendClientEvent({ type: "response.create" }, "trigger response");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== "CONNECTED" || dataChannel?.readyState !== "open")
      return;
    cancelAssistantSpeech();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
  };

  const handleTalkButtonUp = () => {
    if (
      sessionStatus !== "CONNECTED" ||
      dataChannel?.readyState !== "open" ||
      !isPTTUserSpeaking
    )
      return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendClientEvent({ type: "response.create" }, "trigger response PTT");
  };

  const saveNewSummary = async (userId: string, summaryContent: string, duration: number, preSurvey: SurveyData | null, postSurvey: SurveyData | null) => {
    try {
      // Get the count of existing sessions for this user
      const q = query(
        collection(db, 'conversation_summaries'),
        where('userId', '==', userId)
      );
      console.log('saving summary for userId:', userId);
      const querySnapshot = await getDocs(q);
      const sessionNumber = querySnapshot.size + 1;
      // Add new summary with session number
      await addDoc(collection(db, 'conversation_summaries'), {
        userId,
        preSurvey: preSurvey ? { mood: preSurvey.mood ?? 0, attitude: preSurvey.perception ?? 0 } : { mood: 0, attitude: 0 },
        postSurvey: postSurvey ? { mood: postSurvey.mood ?? 0, attitude: postSurvey.perception ?? 0, satisfaction: postSurvey.satisfied ?? 0, } : { mood: 0, attitude: 0, satisfaction: 0 },
        summary: summaryContent,
        transcript: transcriptItems
          .filter((item) => item.type === "MESSAGE")
          .filter((item) => item.role === "assistant" || item.role === "user")
          .map((item) => `${item.role}: ${item.title}`)
          .join('\n\n------\n\n'),
        duration,
        timestamp: serverTimestamp(),
        sessionNumber
      });
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  };

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');

  const onToggleConnection = async (): Promise<void> => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");

      setSelectedSession(0);

      setIsPreSession(false);
      setSurveyModalOpen(true);
    } else {
      await loadPreviousSummaries
      setIsPreSession(true);
      setSurveyModalOpen(true);
    }
  };

  const handleSelectMode = (mode: ConversationMode): void => {
    setConversationMode(mode);
    setModeModalOpen(false);

    // Set PTT based on mode selection
    setTimeout(() => {
      if (mode === 'voice') {
        setIsPTTActive(false);
        connectToRealtime(true);
      } else {
        setIsPTTActive(true);
        connectToRealtime(false);
      }
    }, 0);
  };

  const handleSurveyComplete = (surveyData: SurveyData): void => {
    if (isPreSession) {
      // Pre-session survey
      setPreSurveyData(surveyData);

      setSurveyModalOpen(false);
      setModeModalOpen(true); // Show conversation mode modal after pre-survey
    } else {
      setSurveyModalOpen(false);
      setSummaryModalOpen(true); // Show summary modal after post-survey
      setSummaryContent('Generating summary...');

      generateSessionSummary().then(summaryContent => {
        setSummaryContent(summaryContent);

        if (user && summaryContent) {
          try {
            const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
            saveNewSummary(user.uid, summaryContent, duration, preSurveyData, surveyData);
          } catch (error) {
            console.error('Error saving summary to Firebase:', error);
          }
        }
      });
    }
  };

  const generateSessionSummary = async () => {
    try {
      const summary = transcriptItems
        .filter((item) => item.type === "MESSAGE")
        .filter((item) => item.role === "assistant" || item.role === "user")
        .map((item) => ({ role: item.role, content: item.title }));

      if (summary.length === 0) {
        return 'No conversation to summarize yet.';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that generates concise summaries of therapy sessions. 
            Focus on:
            - Inlcude the participant ID if provided
            - Include user name if provided
            - Key topics discussed
            - Main emotions expressed
            - Important insights or breakthroughs
            - Any action items or goals set
            Format the summary with clear sections and bullet points for better readability.`
            },
            {
              role: "user",
              content: `Please summarize this therapy session in a structured way:\n\n${JSON.stringify(summary, null, 2)}`
              // content: `Please summarize this therapy session in a structured way:\n\n${JSON.stringify(summary, null, 2)}`
            }
          ],
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }

      throw new Error('Unexpected API response format');

    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }

    setIsPreSession(true);
    setSurveyModalOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  // useEffect(() => {
  //   if (audioElementRef.current) {
  //     if (isAudioPlaybackEnabled) {
  //       audioElementRef.current.play().catch((err) => {
  //         console.warn("Autoplay may be blocked by browser:", err);
  //       });
  //     } else {
  //       audioElementRef.current.pause();
  //     }
  //   }
  // }, [isAudioPlaybackEnabled]);

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  function getConnectionButtonLabel() {
    if (isConnected) return "End Conversation";
    if (isConnecting) return "Connecting...";
    return "Start Conversation";
  }

  function getConnectionButtonClasses() {
    const baseClasses = isConnected ? "text-red-600 text-base p-2 w-44 rounded-full h-full" : "text-white text-base p-2 w-44 rounded-full h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-gray-300 hover:bg-red-500 hover:text-white ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> black
    return `bg-gray-400 hover:bg-gray-900 ${cursorClass} ${baseClasses}`;
  }


  return (
    <div className="text-base grid grid-rows-[auto_1fr_auto] sm:h-screen h-[calc(100vh-110px)] max-h-screen bg-gray-100 text-gray-800 relative">
      <div className="p-3 text-lg font-semibold flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-2 sm:mb-0">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-2 sm:mr-4">
            <AvatarImage src="/remibot/avatar.png" alt="Remi" />
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-base sm:text-lg font-medium">Remi</h1>
          </div>
        </div>
        <div>
          <span className="text-sm mr-2">Session</span>
          <select
            className="text-sm outline-none appearance-none"
            value={selectedSession}
            disabled={true}
            onChange={(e) => {
              setSelectedSession(e.target.value as unknown as number);
            }}
          >
            <option value="0"></option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <button
          onClick={onToggleConnection}
          className={getConnectionButtonClasses()}
          disabled={isConnecting}
        >
          {getConnectionButtonLabel()}
        </button>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row gap-2 px-2 overflow-hidden relative h-full">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          canSend={
            sessionStatus === "CONNECTED" &&
            dcRef.current?.readyState === "open"
          }
          showTextBox={conversationMode === 'text'}
        />
      </div>

      <BottomToolbar
        sessionStatus={sessionStatus}
        onToggleConnection={onToggleConnection}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isPTTUserSpeaking={isPTTUserSpeaking}
        handleTalkButtonDown={handleTalkButtonDown}
        handleTalkButtonUp={handleTalkButtonUp}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        isAudioPlaybackEnabled={isAudioPlaybackEnabled}
        setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
      />

      <SessionSurveyModal
        isOpen={surveyModalOpen}
        isPreSession={isPreSession}
        onComplete={handleSurveyComplete}
      />

      <ConversationModeModal
        isOpen={modeModalOpen}
        onSelectMode={handleSelectMode}
      />


      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => {
          setSummaryModalOpen(false);
          setSummaryContent('');
          setModeModalOpen(true);
        }}
        summary={summaryContent}
      />
    </div>
  );
}

export default function AppWithProviders() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventProvider>
        <TranscriptProvider>
          <App />
        </TranscriptProvider>
      </EventProvider>
    </Suspense>
  );
}
