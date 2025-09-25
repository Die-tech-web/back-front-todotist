/**
 * Audio Service for handling voice recording and playback
 */
export class AudioService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioBlob = null;
    this._isStopping = false; // Prevent multiple stop calls
  }

  /**
   * Get the current recording state
   * @returns {boolean} - Whether currently recording
   */
  get isRecording() {
    return this._isRecording;
  }

  /**
   * Set the recording state
   * @param {boolean} value - Recording state
   */
  set isRecording(value) {
    this._isRecording = value;
  }

  /**
   * Check if browser supports MediaRecorder
   * @returns {boolean} - Whether MediaRecorder is supported
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Request microphone permission and start recording
   * @param {number} maxDuration - Maximum recording duration in seconds (default: 30)
   * @param {Function} onDurationUpdate - Callback for duration updates
   * @param {Function} onAutoStop - Callback when recording stops automatically
   * @returns {Promise<void>}
   */
  async startRecording(
    maxDuration = 30,
    onDurationUpdate = null,
    onAutoStop = null
  ) {
    if (this.isRecording) {
      throw new Error("Already recording");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      this.audioChunks = [];
      // Try different MIME types in order of preference
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mpeg",
      ];

      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined, // Let browser choose if none supported
      });

      console.log(
        "Using MediaRecorder with MIME type:",
        this.mediaRecorder.mimeType
      );

      let durationTimer = null;
      let startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Use the actual MIME type from MediaRecorder
        const mimeType = this.mediaRecorder.mimeType || "audio/webm";
        this.audioBlob = new Blob(this.audioChunks, { type: mimeType });

        console.log(
          "Audio blob created with type:",
          this.audioBlob.type,
          "size:",
          this.audioBlob.size
        );

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Clear timer
        if (durationTimer) {
          clearInterval(durationTimer);
        }

        // Call auto-stop callback if provided (after audio is ready)
        if (onAutoStop && this.audioBlob && this.audioBlob.size > 0) {
          onAutoStop();
        }
      };

      // Start recording with 100ms intervals
      this.mediaRecorder.start(100);
      this.isRecording = true;

      // Set up automatic stop after maxDuration
      if (maxDuration > 0) {
        setTimeout(() => {
          if (
            this.isRecording &&
            this.mediaRecorder &&
            this.mediaRecorder.state === "recording" &&
            !this._isStopping
          ) {
            console.log(`Auto-stopping recording after ${maxDuration} seconds`);
            this._isStopping = true; // Prevent multiple stop calls
            this.mediaRecorder.stop();
          }
        }, maxDuration * 1000);
      }

      // Set up duration updates every second
      if (onDurationUpdate) {
        durationTimer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          onDurationUpdate(elapsed);
        }, 1000);
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  /**
   * Stop the current recording
   * @returns {Promise<Blob>} - The recorded audio blob
   */
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error("Not currently recording");
    }

    // Prevent multiple stop calls
    if (this._isStopping) {
      console.log("Stop already in progress, ignoring...");
      return Promise.resolve(this.audioBlob);
    }

    this._isStopping = true;

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        // Use the actual MIME type from MediaRecorder
        const mimeType = this.mediaRecorder.mimeType || "audio/webm";
        this.audioBlob = new Blob(this.audioChunks, { type: mimeType });

        console.log(
          "Audio blob created with type:",
          this.audioBlob.type,
          "size:",
          this.audioBlob.size
        );

        this.isRecording = false;
        this.mediaRecorder = null;
        this._isStopping = false; // Reset the flag

        // Stop all tracks to release microphone
        const stream = this.mediaRecorder?.stream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        resolve(this.audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the recorded audio as a File object
   * @param {string} filename - The filename for the audio file
   * @returns {File} - The audio file
   */
  getAudioFile(filename = "voice_message.webm") {
    if (!this.audioBlob) {
      throw new Error("No audio recorded");
    }

    // Use the blob's actual type, with fallback
    const fileType = this.audioBlob.type || "audio/webm";

    // Adjust filename extension based on MIME type
    let adjustedFilename = filename;
    if (fileType.includes("mp4")) {
      adjustedFilename = filename.replace(/\.(webm|wav|mp3)$/i, ".m4a");
    } else if (fileType.includes("webm")) {
      adjustedFilename = filename.replace(/\.(m4a|wav|mp3)$/i, ".webm");
    }

    console.log(
      "Creating audio file with type:",
      fileType,
      "filename:",
      adjustedFilename
    );

    return new File([this.audioBlob], adjustedFilename, {
      type: fileType,
    });
  }

  /**
   * Create audio preview URL for playback
   * @returns {string|null} - Object URL for audio preview
   */
  createPreviewUrl() {
    if (!this.audioBlob) {
      return null;
    }

    return URL.createObjectURL(this.audioBlob);
  }

  /**
   * Clean up audio preview URL
   * @param {string} url - The object URL to revoke
   */
  static revokePreviewUrl(url) {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get recording duration in seconds
   * @returns {number} - Duration in seconds
   */
  getRecordingDuration() {
    if (!this.isRecording || !this.mediaRecorder) {
      return 0;
    }

    // Estimate duration based on chunks
    const totalSize = this.audioChunks.reduce(
      (sum, chunk) => sum + chunk.size,
      0
    );
    const bitrate = 128000; // 128 kbps
    return Math.round((totalSize * 8) / bitrate);
  }

  /**
   * Format duration for display
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration (MM:SS)
   */
  static formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Validate audio file before upload
   * @param {File} file - The audio file to validate
   * @returns {boolean} - Whether the file is valid
   */
  static validateAudioFile(file) {
    const allowedTypes = [
      "audio/webm",
      "video/webm", // Sometimes MediaRecorder creates video/webm
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/ogg",
      "audio/mp4",
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
      throw new Error("No audio file provided");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please record an audio message or upload MP3, WAV, M4A, OGG, or WebM files."
      );
    }

    if (file.size > maxSize) {
      throw new Error("Audio file too large. Maximum size is 10MB.");
    }

    if (file.size === 0) {
      throw new Error("Audio file is empty. Please record a message first.");
    }

    return true;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.audioBlob) {
      this.audioBlob = null;
    }

    this.audioChunks = [];
    this.isRecording = false;
    this.mediaRecorder = null;
    this._isStopping = false; // Reset the stopping flag
  }
}

// Export a singleton instance
export const audioService = new AudioService();
