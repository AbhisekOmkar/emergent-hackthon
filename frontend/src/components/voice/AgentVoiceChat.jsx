import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { toast } from 'sonner';
import { useLiveKitAgent } from '../../hooks/useLiveKitAgent';
import { Button } from '../ui/button';
import { Loader2, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Track } from 'livekit-client';

const VoiceChatContent = () => {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const disconnect = () => {
    if (room) {
      room.disconnect();
    }
  };

  // Get all audio tracks
  const audioTracks = useTracks([Track.Source.Microphone]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
      {/* Connection Status */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {connectionState === 'connected'
            ? 'Connected to Agent'
            : connectionState === 'connecting'
            ? 'Connecting...'
            : 'Disconnected'}
        </h2>
        <p className="text-sm text-gray-500">
          Status: {connectionState}
        </p>
      </div>

      {/* Audio Visualizer Placeholder */}
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
          <Mic className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          onClick={toggleMute}
          variant={isMuted ? 'destructive' : 'default'}
          size="lg"
          className="gap-2"
        >
          {isMuted ? (
            <>
              <MicOff className="w-5 h-5" />
              Unmute
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Mute
            </>
          )}
        </Button>
        <Button
          onClick={disconnect}
          variant="outline"
          size="lg"
          className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </Button>
      </div>

      {/* Room Audio Renderer */}
      <RoomAudioRenderer />
    </div>
  );
};

export const AgentVoiceChat = ({
  agentId,
  userId,
  agentName = 'default-agent',
  voiceModel = 'nova',
  onClose,
}) => {
  const [isStarting, setIsStarting] = useState(true);

  const {
    token,
    roomName,
    isConnected,
  } = useLiveKitAgent({
    agentId,
    userId,
    onError: (error) => {
      toast.error('Connection Error', {
        description: error.message,
      });
    },
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        setIsStarting(false);
      }
    },
  });

  // Start conversation when connected
  useEffect(() => {
    if (isConnected && token) {
      const startConversation = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/voice/start-conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room: roomName,
              agent_name: agentName,
              user_id: userId,
              voice_model: voiceModel,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to start conversation');
          }

          toast.success('Voice conversation started!');
        } catch (error) {
          toast.error('Error', {
            description: 'Failed to start conversation with agent',
          });
        }
      };

      startConversation();
    }
  }, [isConnected, token, roomName, agentName, userId, voiceModel]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Connecting to agent...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.REACT_APP_LIVEKIT_URL || 'wss://newvoicestack-32ipf6tn.livekit.cloud'}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onClose}
      className="h-full w-full"
    >
      {isStarting ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Starting conversation...</p>
          </div>
        </div>
      ) : (
        <VoiceChatContent />
      )}
    </LiveKitRoom>
  );
};
