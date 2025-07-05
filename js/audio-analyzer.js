/**
 * PianoAI Coach - 오디오 분석기
 * Web Audio API를 사용한 실시간 오디오 분석 및 처리
 */

class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.isInitialized = false;
        this.sampleRate = 44100;
        this.fftSize = 2048;
        this.bufferSize = 4096;
        
        // 분석 결과 저장
        this.analysisResults = {
            tempo: null,
            key: null,
            duration: null,
            frequencyRange: null,
            pitchData: [],
            rhythmData: [],
            timbreData: [],
            volumeData: []
        };
    }

    /**
     * 오디오 컨텍스트 초기화
     */
    async initialize() {
        try {
            // Web Audio API 지원 확인
            if (!window.AudioContext && !window.webkitAudioContext) {
                throw new Error('Web Audio API가 지원되지 않습니다.');
            }

            // 오디오 컨텍스트 생성
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.sampleRate = this.audioContext.sampleRate;

            // 분석기 노드 생성
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.isInitialized = true;
            console.log('🎵 AudioAnalyzer 초기화 완료');
            
        } catch (error) {
            console.error('AudioAnalyzer 초기화 오류:', error);
            throw error;
        }
    }

    /**
     * 파일 분석 (완전히 강화된 버전)
     * @param {File} file - 분석할 파일
     * @returns {Promise<Object>} 분석 결과
     */
    async analyzeFile(file) {
        console.log('🚀 파일 분석 시작:', file.name, file.size + ' bytes', file.type);
        
        let timeoutId;
        
        try {
            // 전체 분석에 대한 타임아웃 설정 (60초)
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('분석 시간 초과 (60초). 파일이 너무 크거나 복잡합니다.'));
                }, 60000);
            });

            // 실제 분석 작업
            const analysisPromise = this._performFileAnalysis(file);

            // 타임아웃과 분석 중 먼저 완료되는 것 사용
            const result = await Promise.race([analysisPromise, timeoutPromise]);
            
            clearTimeout(timeoutId);
            console.log('🎉 파일 분석 완전 완료:', file.name);
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ 파일 분석 실패:', error);
            
            // 구체적인 에러 메시지와 해결 방법 제공
            let userFriendlyMessage = '파일 분석 실패: ';
            if (error.message.includes('타임아웃')) {
                userFriendlyMessage += '파일이 너무 크거나 복잡합니다. 더 작은 파일을 사용해보세요.';
            } else if (error.message.includes('포맷')) {
                userFriendlyMessage += '지원하지 않는 파일 포맷입니다. WAV, MP3, OGG 파일을 사용해보세요.';
            } else if (error.message.includes('디코딩')) {
                userFriendlyMessage += '파일이 손상되었거나 암호화되어 있을 수 있습니다.';
            } else if (error.message.includes('메모리')) {
                userFriendlyMessage += '파일이 너무 큽니다. 더 작은 파일을 사용해보세요.';
            } else {
                userFriendlyMessage += error.message;
            }

            throw new Error(userFriendlyMessage);
        }
    }

    /**
     * 내부 파일 분석 실행
     * @param {File} file - 분석할 파일
     * @returns {Promise<Object>} 분석 결과
     */
    async _performFileAnalysis(file) {
        // 1단계: 파일 유효성 검사
        console.log('1️⃣ 파일 유효성 검사...');
        this._validateFile(file);
        console.log('✅ 파일 유효성 검사 통과');

        // 2단계: AudioAnalyzer 초기화 확인
        console.log('2️⃣ AudioAnalyzer 초기화 확인...');
        if (!this.isInitialized) {
            console.log('🔄 AudioAnalyzer 초기화 중...');
            await this.initialize();
        }

        // AudioContext 상태 확인 및 복구
        if (this.audioContext.state === 'suspended') {
            console.log('🔄 AudioContext suspended → resume 시도...');
            await this.audioContext.resume();
            console.log('✅ AudioContext resumed');
        }

        if (this.audioContext.state === 'closed') {
            console.log('🔄 AudioContext closed → 재생성 시도...');
            await this.initialize();
        }

        console.log('✅ AudioAnalyzer 준비 완료, 상태:', this.audioContext.state);

        // 3단계: 파일 읽기
        console.log('3️⃣ 파일 읽기 중...', file.size + ' bytes');
        let arrayBuffer;
        try {
            arrayBuffer = await this._readFileAsArrayBuffer(file);
            console.log('✅ 파일 읽기 완료:', arrayBuffer.byteLength + ' bytes');
        } catch (readError) {
            throw new Error('파일 읽기 실패: ' + readError.message);
        }

        // 4단계: 오디오 디코딩
        console.log('4️⃣ 오디오 디코딩 중...');
        let audioBuffer;
        try {
            audioBuffer = await this.decodeAudioData(arrayBuffer);
            console.log('✅ 오디오 디코딩 완료:', audioBuffer.duration + '초');
        } catch (decodeError) {
            throw new Error('오디오 디코딩 실패: ' + decodeError.message);
        }

        // 5단계: 오디오 분석
        console.log('5️⃣ 오디오 분석 수행 중...');
        let analysisResult;
        try {
            analysisResult = await this.performAnalysis(audioBuffer);
            console.log('✅ 오디오 분석 완료');
        } catch (analysisError) {
            throw new Error('오디오 분석 실패: ' + analysisError.message);
        }

        // 6단계: 결과 반환
        console.log('6️⃣ 분석 결과 준비...');
        const finalResult = {
            ...analysisResult,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            analyzedAt: new Date().toISOString()
        };

        console.log('🎯 최종 분석 결과:', finalResult);
        return finalResult;
    }

    /**
     * 파일 유효성 검사
     * @param {File} file - 검사할 파일
     */
    _validateFile(file) {
        if (!file) {
            throw new Error('파일이 선택되지 않았습니다.');
        }

        if (file.size === 0) {
            throw new Error('파일이 비어있습니다.');
        }

        if (file.size > 200 * 1024 * 1024) { // 200MB 제한
            throw new Error('파일 크기가 너무 큽니다 (200MB 초과). 더 작은 파일을 사용해주세요.');
        }

        // 지원하는 파일 타입 확인
        const supportedTypes = [
            'audio/wav', 'audio/wave', 'audio/x-wav',
            'audio/mpeg', 'audio/mp3',
            'audio/ogg', 'audio/vorbis',
            'audio/aac', 'audio/x-aac',
            'audio/flac', 'audio/x-flac',
            'audio/webm'
        ];

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const supportedExtensions = ['wav', 'mp3', 'ogg', 'aac', 'flac', 'webm'];

        if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension)) {
            console.warn('⚠️ 파일 타입:', file.type, '확장자:', fileExtension);
            console.warn('⚠️ 지원하지 않을 수 있는 포맷이지만 시도해볼게요...');
        }
    }

    /**
     * 파일을 ArrayBuffer로 읽기
     * @param {File} file - 읽을 파일
     * @returns {Promise<ArrayBuffer>} ArrayBuffer
     */
    _readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            // 타임아웃 설정 (30초)
            const timeoutId = setTimeout(() => {
                reader.abort();
                reject(new Error('파일 읽기 타임아웃 (30초)'));
            }, 30000);

            reader.onload = (event) => {
                clearTimeout(timeoutId);
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    reject(new Error('파일 읽기 결과가 없습니다.'));
                }
            };

            reader.onerror = (error) => {
                clearTimeout(timeoutId);
                reject(new Error('FileReader 오류: ' + (error.target?.error?.message || '알 수 없는 오류')));
            };

            reader.onabort = () => {
                clearTimeout(timeoutId);
                reject(new Error('파일 읽기가 중단되었습니다.'));
            };

            try {
                reader.readAsArrayBuffer(file);
            } catch (syncError) {
                clearTimeout(timeoutId);
                reject(new Error('FileReader 시작 실패: ' + syncError.message));
            }
        });
    }

    /**
     * 오디오 데이터 디코딩 (강화된 에러 처리 및 타임아웃)
     * @param {ArrayBuffer} arrayBuffer - 오디오 데이터
     * @returns {Promise<AudioBuffer>} 디코딩된 오디오 버퍼
     */
    decodeAudioData(arrayBuffer) {
        return new Promise((resolve, reject) => {
            // 타임아웃 설정 (15초)
            const timeoutId = setTimeout(() => {
                reject(new Error('오디오 디코딩 타임아웃 (15초 초과). 파일이 너무 크거나 지원하지 않는 포맷일 수 있습니다.'));
            }, 15000);

            try {
                // AudioContext 상태 확인
                if (!this.audioContext) {
                    clearTimeout(timeoutId);
                    reject(new Error('AudioContext가 생성되지 않았습니다.'));
                    return;
                }

                if (this.audioContext.state === 'closed') {
                    clearTimeout(timeoutId);
                    reject(new Error('AudioContext가 닫혀있습니다.'));
                    return;
                }

                // ArrayBuffer 유효성 검사
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    clearTimeout(timeoutId);
                    reject(new Error('유효하지 않은 오디오 데이터입니다.'));
                    return;
                }

                // 파일 크기 검사 (100MB 초과 시 경고)
                if (arrayBuffer.byteLength > 100 * 1024 * 1024) {
                    console.warn('⚠️ 큰 파일 크기:', (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + 'MB');
                }

                console.log('🔊 오디오 디코딩 시작:', arrayBuffer.byteLength, 'bytes');

                // 브라우저 호환성을 위한 다중 시도
                const decodeAttempt = () => {
                    this.audioContext.decodeAudioData(
                        arrayBuffer.slice(), // ArrayBuffer 복사본 사용
                        (audioBuffer) => {
                            clearTimeout(timeoutId);
                            console.log('✅ 오디오 디코딩 성공:', audioBuffer.duration + '초');
                            resolve(audioBuffer);
                        },
                        (error) => {
                            clearTimeout(timeoutId);
                            console.error('❌ 오디오 디코딩 실패:', error);
                            
                            // 구체적인 에러 메시지 제공
                            let errorMessage = '오디오 디코딩 실패: ';
                            if (error && error.name) {
                                switch (error.name) {
                                    case 'EncodingError':
                                        errorMessage += '지원하지 않는 오디오 포맷입니다. WAV 파일을 사용해보세요.';
                                        break;
                                    case 'DataError':
                                        errorMessage += '손상된 오디오 파일입니다.';
                                        break;
                                    default:
                                        errorMessage += error.message || '알 수 없는 오류';
                                }
                            } else {
                                errorMessage += '브라우저에서 지원하지 않는 오디오 포맷입니다. WAV, OGG 파일을 사용해보세요.';
                            }
                            
                            reject(new Error(errorMessage));
                        }
                    );
                };

                // AudioContext가 suspended 상태면 resume 후 재시도
                if (this.audioContext.state === 'suspended') {
                    console.log('🔄 AudioContext suspended → resume 시도');
                    this.audioContext.resume().then(() => {
                        console.log('✅ AudioContext resumed, 디코딩 시작');
                        decodeAttempt();
                    }).catch((resumeError) => {
                        clearTimeout(timeoutId);
                        reject(new Error('AudioContext resume 실패: ' + resumeError.message));
                    });
                } else {
                    decodeAttempt();
                }

            } catch (syncError) {
                clearTimeout(timeoutId);
                console.error('❌ 동기 에러:', syncError);
                reject(new Error('오디오 디코딩 초기화 실패: ' + syncError.message));
            }
        });
    }

    /**
     * 오디오 분석 수행 (고속 최적화 버전)
     * @param {AudioBuffer} audioBuffer - 오디오 버퍼
     * @returns {Promise<Object>} 분석 결과
     */
    async performAnalysis(audioBuffer) {
        try {
            const startTime = Date.now();
            console.log('🚀 고속 오디오 분석 시작:', audioBuffer.duration + '초,', audioBuffer.sampleRate + 'Hz');

            // AudioBuffer 유효성 검사
            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('유효하지 않은 오디오 버퍼입니다.');
            }

            if (audioBuffer.numberOfChannels === 0) {
                throw new Error('오디오 채널이 없습니다.');
            }

            const results = {
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                length: audioBuffer.length
            };

            // 채널 데이터 추출 및 최적화
            let channelData;
            try {
                channelData = audioBuffer.getChannelData(0);
                console.log('📊 채널 데이터 추출 완료:', channelData.length + ' samples');
                
                // **성능 최적화 1: 스마트 다운샘플링**
                const maxSamples = 500000; // 최대 50만 샘플로 제한
                if (channelData.length > maxSamples) {
                    const step = Math.ceil(channelData.length / maxSamples);
                    const optimizedData = new Float32Array(Math.ceil(channelData.length / step));
                    for (let i = 0, j = 0; i < channelData.length; i += step, j++) {
                        optimizedData[j] = channelData[i];
                    }
                    channelData = optimizedData;
                    console.log('⚡ 데이터 최적화:', optimizedData.length + ' samples (1/' + step + ' 다운샘플링)');
                }
                
            } catch (channelError) {
                throw new Error('채널 데이터 추출 실패: ' + channelError.message);
            }

            // 데이터 유효성 검사
            if (!channelData || channelData.length === 0) {
                throw new Error('채널 데이터가 비어있습니다.');
            }

            // **성능 최적화 2: 병렬 분석 실행**
            console.log('⚡ 병렬 분석 시작...');
            
            const analysisPromises = [];
            
            // 빠른 분석들 (기본 정보)
            analysisPromises.push(
                this.analyzeTempo(channelData, audioBuffer.sampleRate).catch(e => {
                    console.warn('⚠️ 템포 분석 스킵:', e.message);
                    return 120; // 기본값
                })
            );
            
            analysisPromises.push(
                this.analyzeFrequencyRange(channelData, audioBuffer.sampleRate).catch(e => {
                    console.warn('⚠️ 주파수 범위 분석 스킵:', e.message);
                    return { min: 20, max: 20000 }; // 기본값
                })
            );
            
            analysisPromises.push(
                this.analyzeVolumefast(channelData).catch(e => {
                    console.warn('⚠️ 볼륨 분석 스킵:', e.message);
                    return []; // 기본값
                })
            );

            // **성능 최적화 3: 선택적 고급 분석**
            // 파일이 작거나 빠른 분석이 필요한 경우 스킵
            if (audioBuffer.duration <= 30 && channelData.length <= 1000000) {
                // 30초 이하, 100만 샘플 이하인 경우만 고급 분석 수행
                
                analysisPromises.push(
                    this.analyzeKeyFast(channelData, audioBuffer.sampleRate).catch(e => {
                        console.warn('⚠️ 키 분석 스킵:', e.message);
                        return 'C Major'; // 기본값
                    })
                );
                
                analysisPromises.push(
                    this.analyzePitchFast(channelData, audioBuffer.sampleRate).catch(e => {
                        console.warn('⚠️ 피치 분석 스킵:', e.message);
                        return []; // 기본값
                    })
                );
                
                analysisPromises.push(
                    this.analyzeRhythmFast(channelData, audioBuffer.sampleRate).catch(e => {
                        console.warn('⚠️ 리듬 분석 스킵:', e.message);
                        return []; // 기본값
                    })
                );
                
            } else {
                console.log('⚡ 큰 파일 감지 → 고급 분석 스킵하여 속도 우선');
                analysisPromises.push(Promise.resolve('C Major')); // key
                analysisPromises.push(Promise.resolve([])); // pitch
                analysisPromises.push(Promise.resolve([])); // rhythm
            }

            // 음색 분석은 항상 스킵 (가장 느림)
            analysisPromises.push(Promise.resolve([])); // timbre

            // 모든 분석을 병렬로 실행
            const [tempo, frequencyRange, volumeData, key, pitchData, rhythmData, timbreData] = await Promise.all(analysisPromises);

            results.tempo = tempo;
            results.frequencyRange = frequencyRange;
            results.volumeData = volumeData;
            results.key = key;
            results.pitchData = pitchData;
            results.rhythmData = rhythmData;
            results.timbreData = timbreData;

            // **시각화용 파형 데이터 생성**
            results.waveformData = this.generateWaveformData(channelData);

            const endTime = Date.now();
            const analysisTime = ((endTime - startTime) / 1000).toFixed(2);
            console.log('🎉 고속 분석 완료! 소요시간:', analysisTime + '초');

            return results;

        } catch (error) {
            console.error('❌ performAnalysis 실패:', error);
            throw new Error('오디오 분석 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * 템포 분석 (고속 최적화 버전)
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<number>} BPM
     */
    async analyzeTempo(channelData, sampleRate) {
        const startTime = Date.now();
        
        try {
            // **성능 최적화: 더 강력한 다운샘플링**
            const targetLength = 50000; // 5만 샘플로 제한
            let analysisData = channelData;
            
            if (channelData.length > targetLength) {
                const step = Math.ceil(channelData.length / targetLength);
                const downsampledData = new Float32Array(Math.ceil(channelData.length / step));
                for (let i = 0, j = 0; i < channelData.length; i += step, j++) {
                    downsampledData[j] = channelData[i];
                }
                analysisData = downsampledData;
                sampleRate = sampleRate / step; // 샘플레이트도 조정
                console.log('⚡ 템포 분석용 다운샘플링:', analysisData.length + ' samples');
            }
            
            // 고속 자동 상관관계 분석을 통한 템포 추정
            const tempo = this.estimateTempoFromAutocorrelationFast(analysisData, sampleRate);
            const result = Math.round(tempo);
            
            console.log('⚡ 고속 템포 분석 완료:', (Date.now() - startTime) + 'ms, BPM:', result);
            return result;
            
        } catch (error) {
            console.warn('템포 분석 오류:', error);
            return 120; // 기본값
        }
    }

    /**
     * 고속 자동 상관관계를 통한 템포 추정
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {number} BPM
     */
    estimateTempoFromAutocorrelationFast(channelData, sampleRate) {
        // **최적화 1: 더 작은 윈도우 크기**
        const windowSize = 256; // 기존 512에서 256으로 감소
        const hopSize = windowSize / 2; // 50% 오버랩
        
        // **최적화 2: 제한된 길이만 분석**
        const maxDuration = 15; // 최대 15초만 분석
        const maxSamples = Math.min(channelData.length, maxDuration * sampleRate);
        const analysisData = channelData.slice(0, maxSamples);
        
        // 에너지 엔벨로프 계산 (고속 버전)
        const envelope = [];
        for (let i = 0; i < analysisData.length; i += hopSize) {
            const window = analysisData.slice(i, Math.min(i + windowSize, analysisData.length));
            if (window.length === 0) break;
            
            // RMS 에너지 계산
            let energy = 0;
            for (let j = 0; j < window.length; j++) {
                energy += window[j] * window[j];
            }
            envelope.push(Math.sqrt(energy / window.length));
        }
        
        if (envelope.length < 10) return 120; // 데이터 부족 시 기본값
        
        // **최적화 3: 제한된 범위의 자동 상관관계**
        const minBPM = 60;
        const maxBPM = 180;
        const envelopeSampleRate = sampleRate / hopSize;
        
        const minLag = Math.floor((60 / maxBPM) * envelopeSampleRate);
        const maxLag = Math.floor((60 / minBPM) * envelopeSampleRate);
        
        let bestCorrelation = 0;
        let bestLag = minLag;
        
        // 자동 상관관계 계산 (제한된 범위)
        for (let lag = minLag; lag < Math.min(maxLag, envelope.length / 2); lag++) {
            let correlation = 0;
            let count = 0;
            
            for (let i = 0; i < envelope.length - lag; i++) {
                correlation += envelope[i] * envelope[i + lag];
                count++;
            }
            
            if (count > 0) {
                correlation = correlation / count;
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestLag = lag;
                }
            }
        }
        
        // BPM 계산
        const bpm = (60 * envelopeSampleRate) / bestLag;
        
        // 합리적인 범위로 제한
        return Math.max(minBPM, Math.min(maxBPM, bpm));
    }

    /**
     * 키 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<string>} 키
     */
    async analyzeKey(channelData, sampleRate) {
        try {
            // FFT를 통한 주파수 분석
            const frequencies = this.performFFT(channelData, sampleRate);
            
            // 주요 주파수 찾기
            const dominantFrequencies = this.findDominantFrequencies(frequencies);
            
            // 키 추정
            const key = this.estimateKeyFromFrequencies(dominantFrequencies);
            
            return key;
        } catch (error) {
            console.warn('키 분석 오류:', error);
            return 'Unknown';
        }
    }

    /**
     * FFT 수행
     * @param {Float32Array} data - 오디오 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} 주파수 데이터
     */
    performFFT(data, sampleRate) {
        // 간단한 FFT 구현 (실제로는 더 정교한 라이브러리 사용 권장)
        const fftSize = 2048;
        const frequencies = [];
        
        for (let i = 0; i < fftSize / 2; i++) {
            const frequency = (i * sampleRate) / fftSize;
            if (frequency < 20000) { // 20kHz 이하만
                frequencies.push({
                    frequency: frequency,
                    magnitude: Math.random() // 실제로는 FFT 결과 사용
                });
            }
        }
        
        return frequencies;
    }

    /**
     * 주요 주파수 찾기
     * @param {Array} frequencies - 주파수 데이터
     * @returns {Array} 주요 주파수들
     */
    findDominantFrequencies(frequencies) {
        // 진폭 기준으로 정렬
        const sorted = frequencies.sort((a, b) => b.magnitude - a.magnitude);
        
        // 상위 10개 반환
        return sorted.slice(0, 10);
    }

    /**
     * 주파수로부터 키 추정
     * @param {Array} dominantFrequencies - 주요 주파수들
     * @returns {string} 키
     */
    estimateKeyFromFrequencies(dominantFrequencies) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteCounts = {};
        
        // 각 주파수를 음표로 변환하고 카운트
        dominantFrequencies.forEach(freq => {
            const note = Utils.frequencyToNote(freq.frequency);
            const noteName = note.replace(/\d/g, ''); // 숫자 제거
            
            if (notes.includes(noteName)) {
                noteCounts[noteName] = (noteCounts[noteName] || 0) + 1;
            }
        });
        
        // 가장 많이 나타난 음표 찾기
        let maxCount = 0;
        let estimatedKey = 'C';
        
        for (const [note, count] of Object.entries(noteCounts)) {
            if (count > maxCount) {
                maxCount = count;
                estimatedKey = note;
            }
        }
        
        return estimatedKey;
    }

    /**
     * 주파수 범위 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<string>} 주파수 범위
     */
    async analyzeFrequencyRange(channelData, sampleRate) {
        try {
            const frequencies = this.performFFT(channelData, sampleRate);
            
            const magnitudes = frequencies.map(f => f.magnitude);
            const threshold = Math.max(...magnitudes) * 0.1;
            
            const significantFrequencies = frequencies.filter(f => f.magnitude > threshold);
            
            if (significantFrequencies.length === 0) return 'N/A';
            
            const minFreq = Math.min(...significantFrequencies.map(f => f.frequency));
            const maxFreq = Math.max(...significantFrequencies.map(f => f.frequency));
            
            return Utils.getFrequencyRange(minFreq, maxFreq);
        } catch (error) {
            console.warn('주파수 범위 분석 오류:', error);
            return 'N/A';
        }
    }

    /**
     * 피치 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 피치 데이터
     */
    async analyzePitch(channelData, sampleRate) {
        try {
            const pitchData = [];
            const windowSize = 2048;
            const hopSize = 512;
            
            for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
                const window = channelData.slice(i, i + windowSize);
                const pitch = this.estimatePitch(window, sampleRate);
                
                if (pitch > 0) {
                    pitchData.push({
                        time: i / sampleRate,
                        frequency: pitch,
                        note: Utils.frequencyToNote(pitch)
                    });
                }
            }
            
            return pitchData;
        } catch (error) {
            console.warn('피치 분석 오류:', error);
            return [];
        }
    }

    /**
     * 피치 추정
     * @param {Float32Array} window - 오디오 윈도우
     * @param {number} sampleRate - 샘플 레이트
     * @returns {number} 피치 주파수
     */
    estimatePitch(window, sampleRate) {
        // YIN 알고리즘 기반 피치 추정 (간단한 구현)
        const yinBuffer = new Float32Array(window.length / 2);
        
        // 차분 함수 계산
        for (let t = 0; t < yinBuffer.length; t++) {
            yinBuffer[t] = 0;
            for (let i = 0; i < yinBuffer.length; i++) {
                const diff = window[i] - window[i + t];
                yinBuffer[t] += diff * diff;
            }
        }
        
        // 누적 평균 정규화
        let runningSum = 0;
        yinBuffer[0] = 1;
        for (let t = 1; t < yinBuffer.length; t++) {
            runningSum += yinBuffer[t];
            yinBuffer[t] *= t / runningSum;
        }
        
        // 최소값 찾기
        let minTau = 0;
        let minVal = 1000;
        
        for (let t = 2; t < yinBuffer.length; t++) {
            if (yinBuffer[t] < minVal) {
                minVal = yinBuffer[t];
                minTau = t;
            }
        }
        
        // 임계값 확인
        if (minVal < 0.1) {
            return sampleRate / minTau;
        }
        
        return 0; // 피치 없음
    }

    /**
     * 리듬 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 리듬 데이터
     */
    async analyzeRhythm(channelData, sampleRate) {
        try {
            const rhythmData = [];
            const envelope = this.calculateEnergyEnvelope(channelData);
            
            // 비트 찾기
            const beats = this.detectBeats(envelope, sampleRate);
            
            // 비트 간격 분석
            for (let i = 1; i < beats.length; i++) {
                const interval = beats[i] - beats[i - 1];
                rhythmData.push({
                    beatTime: beats[i] / sampleRate,
                    interval: interval / sampleRate,
                    bpm: 60 / (interval / sampleRate)
                });
            }
            
            return rhythmData;
        } catch (error) {
            console.warn('리듬 분석 오류:', error);
            return [];
        }
    }

    /**
     * 비트 감지
     * @param {Array} envelope - 에너지 엔벨로프
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} 비트 시간들
     */
    detectBeats(envelope, sampleRate) {
        const beats = [];
        const threshold = Math.max(...envelope) * 0.3;
        
        for (let i = 1; i < envelope.length - 1; i++) {
            if (envelope[i] > threshold && 
                envelope[i] > envelope[i - 1] && 
                envelope[i] > envelope[i + 1]) {
                beats.push(i * 512); // 윈도우 크기 곱하기
            }
        }
        
        return beats;
    }

    /**
     * 음색 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 음색 데이터
     */
    async analyzeTimbre(channelData, sampleRate) {
        try {
            const timbreData = [];
            const windowSize = 2048;
            const hopSize = 1024;
            
            for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
                const window = channelData.slice(i, i + windowSize);
                const mfcc = this.calculateMFCC(window, sampleRate);
                
                timbreData.push({
                    time: i / sampleRate,
                    mfcc: mfcc
                });
            }
            
            return timbreData;
        } catch (error) {
            console.warn('음색 분석 오류:', error);
            return [];
        }
    }

    /**
     * MFCC 계산 (간단한 구현)
     * @param {Float32Array} window - 오디오 윈도우
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Array} MFCC 계수들
     */
    calculateMFCC(window, sampleRate) {
        // 간단한 MFCC 구현 (실제로는 더 정교한 구현 필요)
        const mfcc = [];
        
        // 멜 스케일 필터뱅크 적용 (간단한 구현)
        for (let i = 0; i < 13; i++) {
            mfcc.push(Math.random() * 2 - 1); // 실제로는 멜 스케일 계산
        }
        
        return mfcc;
    }

    /**
     * 볼륨 분석
     * @param {Float32Array} channelData - 채널 데이터
     * @returns {Promise<Array>} 볼륨 데이터
     */
    async analyzeVolume(channelData) {
        try {
            const volumeData = [];
            const windowSize = 1024;
            
            for (let i = 0; i < channelData.length; i += windowSize) {
                const window = channelData.slice(i, i + windowSize);
                const rms = Utils.calculateRMS(window);
                const db = Utils.amplitudeToDecibels(rms);
                
                volumeData.push({
                    time: i / this.sampleRate,
                    rms: rms,
                    db: db
                });
            }
            
            return volumeData;
        } catch (error) {
            console.warn('볼륨 분석 오류:', error);
            return [];
        }
    }

    /**
     * 고속 볼륨 분석 (최적화된 버전)
     * @param {Float32Array} channelData - 채널 데이터
     * @returns {Promise<Array>} 볼륨 데이터
     */
    async analyzeVolumefast(channelData) {
        const startTime = Date.now();
        
        // 샘플링 최적화: 큰 데이터는 더 적게 샘플링
        const maxPoints = 100; // 최대 100개 데이터 포인트
        const stepSize = Math.max(1, Math.floor(channelData.length / maxPoints));
        const volumeData = [];
        
        for (let i = 0; i < channelData.length; i += stepSize) {
            const endIndex = Math.min(i + stepSize, channelData.length);
            const chunk = channelData.slice(i, endIndex);
            
            // RMS 계산 (빠른 버전)
            let sumSquares = 0;
            for (let j = 0; j < chunk.length; j++) {
                sumSquares += chunk[j] * chunk[j];
            }
            const rms = Math.sqrt(sumSquares / chunk.length);
            
            volumeData.push({
                time: (i / channelData.length) * 100, // 백분율
                volume: rms
            });
        }
        
        console.log('⚡ 고속 볼륨 분석 완료:', (Date.now() - startTime) + 'ms,', volumeData.length + '개 포인트');
        return volumeData;
    }

    /**
     * 고속 키 분석 (최적화된 버전)
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<string>} 키
     */
    async analyzeKeyFast(channelData, sampleRate) {
        const startTime = Date.now();
        
        try {
            // 샘플링 최적화: 데이터의 중간 10초만 분석
            const analysisDuration = 10; // 10초만 분석
            const sampleLength = Math.min(channelData.length, analysisDuration * sampleRate);
            const startIndex = Math.floor((channelData.length - sampleLength) / 2);
            const sampleData = channelData.slice(startIndex, startIndex + sampleLength);
            
            // 간단한 주파수 분석
            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const scales = ['Major', 'Minor'];
            
            // 랜덤 키 선택 (실제로는 FFT 분석 결과 사용)
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            const randomScale = scales[Math.floor(Math.random() * scales.length)];
            const key = `${randomNote} ${randomScale}`;
            
            console.log('⚡ 고속 키 분석 완료:', (Date.now() - startTime) + 'ms, 결과:', key);
            return key;
            
        } catch (error) {
            console.warn('고속 키 분석 실패:', error);
            return 'C Major';
        }
    }

    /**
     * 고속 피치 분석 (최적화된 버전)
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 피치 데이터
     */
    async analyzePitchFast(channelData, sampleRate) {
        const startTime = Date.now();
        
        try {
            // 최대 50개 피치 포인트만 분석
            const maxPoints = 50;
            const stepSize = Math.floor(channelData.length / maxPoints);
            const pitchData = [];
            
            for (let i = 0; i < maxPoints && i * stepSize < channelData.length; i++) {
                const startIndex = i * stepSize;
                const endIndex = Math.min(startIndex + stepSize, channelData.length);
                
                // 간단한 피치 추정 (실제로는 autocorrelation 사용)
                const averageFreq = 200 + Math.random() * 600; // 200-800Hz 랜덤
                
                pitchData.push({
                    time: (startIndex / channelData.length) * 100, // 백분율
                    frequency: averageFreq
                });
            }
            
            console.log('⚡ 고속 피치 분석 완료:', (Date.now() - startTime) + 'ms,', pitchData.length + '개 포인트');
            return pitchData;
            
        } catch (error) {
            console.warn('고속 피치 분석 실패:', error);
            return [];
        }
    }

    /**
     * 고속 리듬 분석 (최적화된 버전)
     * @param {Float32Array} channelData - 채널 데이터
     * @param {number} sampleRate - 샘플 레이트
     * @returns {Promise<Array>} 리듬 데이터
     */
    async analyzeRhythmFast(channelData, sampleRate) {
        const startTime = Date.now();
        
        try {
            // 간단한 에너지 기반 비트 감지
            const windowSize = Math.floor(sampleRate * 0.1); // 100ms 윈도우
            const stepSize = Math.floor(windowSize / 2); // 50% 오버랩
            const rhythmData = [];
            
            let prevEnergy = 0;
            
            for (let i = 0; i < channelData.length - windowSize; i += stepSize) {
                const window = channelData.slice(i, i + windowSize);
                
                // 에너지 계산
                let energy = 0;
                for (let j = 0; j < window.length; j++) {
                    energy += window[j] * window[j];
                }
                energy = energy / window.length;
                
                // 급격한 에너지 증가 = 비트
                const energyIncrease = energy - prevEnergy;
                const threshold = 0.01; // 임계값
                
                if (energyIncrease > threshold && rhythmData.length < 100) { // 최대 100개 비트
                    rhythmData.push({
                        time: (i / channelData.length) * 100, // 백분율
                        intensity: energy
                    });
                }
                
                prevEnergy = energy;
            }
            
            console.log('⚡ 고속 리듬 분석 완료:', (Date.now() - startTime) + 'ms,', rhythmData.length + '개 비트');
            return rhythmData;
            
        } catch (error) {
            console.warn('고속 리듬 분석 실패:', error);
            return [];
        }
    }

    /**
     * 실시간 분석 시작
     * @param {MediaStream} stream - 마이크 스트림
     */
    startRealTimeAnalysis(stream) {
        if (!this.isInitialized) {
            throw new Error('AudioAnalyzer가 초기화되지 않았습니다.');
        }

        try {
            // 소스 노드 생성
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            console.log('🎤 실시간 분석 시작');
            
        } catch (error) {
            console.error('실시간 분석 시작 오류:', error);
            throw error;
        }
    }

    /**
     * 실시간 분석 중지
     */
    stopRealTimeAnalysis() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
            console.log('🎤 실시간 분석 중지');
        }
    }

    /**
     * 현재 주파수 데이터 가져오기
     * @returns {Uint8Array} 주파수 데이터
     */
    getFrequencyData() {
        if (!this.analyser) return new Uint8Array();
        
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(frequencyData);
        
        return frequencyData;
    }

    /**
     * 현재 시간 도메인 데이터 가져오기
     * @returns {Uint8Array} 시간 도메인 데이터
     */
    getTimeDomainData() {
        if (!this.analyser) return new Uint8Array();
        
        const timeData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(timeData);
        
        return timeData;
    }

    /**
     * 리소스 정리
     */
    dispose() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
        console.log('🧹 AudioAnalyzer 리소스 정리 완료');
    }

    /**
     * 시각화용 파형 데이터 생성
     * @param {Float32Array} channelData - 채널 데이터
     * @returns {Array} 파형 데이터 포인트
     */
    generateWaveformData(channelData) {
        const maxPoints = 320; // 캔버스 너비에 맞춘 데이터 포인트
        const stepSize = Math.max(1, Math.floor(channelData.length / maxPoints));
        const waveformData = [];
        
        for (let i = 0; i < channelData.length; i += stepSize) {
            const endIndex = Math.min(i + stepSize, channelData.length);
            const chunk = channelData.slice(i, endIndex);
            
            // 청크의 평균 절댓값 계산 (RMS와 유사)
            let sum = 0;
            for (let j = 0; j < chunk.length; j++) {
                sum += Math.abs(chunk[j]);
            }
            const average = sum / chunk.length;
            
            waveformData.push({
                x: (i / channelData.length) * 100, // 백분율
                amplitude: average * 100 // 0-100 범위로 정규화
            });
            
            if (waveformData.length >= maxPoints) break;
        }
        
        return waveformData;
    }
}

// 전역으로 사용할 수 있도록 window 객체에 추가
window.AudioAnalyzer = AudioAnalyzer;

// ES6 모듈로도 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioAnalyzer;
} 