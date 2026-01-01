import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Video() {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const startCall = () => {
    Alert.alert(
      'Video Call',
      'WebRTC video calling feature. This is a basic implementation. For production, integrate with Agora or Twilio.',
      [
        { text: 'OK', onPress: () => setInCall(true) }
      ]
    );
  };

  const endCall = () => {
    setInCall(false);
    setMuted(false);
    setCameraOff(false);
  };

  if (inCall) {
    return (
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          <View style={styles.remoteVideo}>
            <Ionicons name="person" size={80} color="#ffffff" />
            <Text style={styles.videoLabel}>Remote Video</Text>
          </View>
          <View style={styles.localVideo}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, muted && styles.controlButtonActive]}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons
              name={muted ? 'mic-off' : 'mic'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Ionicons name="call" size={32} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, cameraOff && styles.controlButtonActive]}
            onPress={() => setCameraOff(!cameraOff)}
          >
            <Ionicons
              name={cameraOff ? 'videocam-off' : 'videocam'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Calls</Text>
        <Text style={styles.subtitle}>Connect with your instructor or students</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="videocam" size={80} color="#6366f1" />
        </View>

        <Text style={styles.infoText}>
          Start a video call to practice yoga with real-time guidance and feedback.
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={startCall}>
          <Ionicons name="videocam" size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>Start Video Call</Text>
        </TouchableOpacity>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.featureText}>HD Video Quality</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.featureText}>Real-time Audio</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.featureText}>Screen Sharing</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  infoText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  featureList: {
    marginTop: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#d1d5db',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 16,
  },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    backgroundColor: '#111827',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ef4444',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
