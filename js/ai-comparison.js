/**
 * PianoAI Coach - AI 비교 분석
 * 원본과 연주를 비교하여 점수와 피드백을 제공하는 AI 분석기
 */

class AIComparison {
    constructor() {
        this.originalAnalysis = null;
        this.recordingAnalysis = null;
        this.comparisonResults = null;
        
        // 분석 가중치 설정
        this.weights = {
            pitch: 0.4,      // 음정 정확도 40%
            rhythm: 0.35,    // 리듬 정확도 35%
            timbre: 0.25     // 음색 유사도 25%
        };
        
        // 점수 기준
        this.scoreThresholds = {
            excellent: 90,
            good: 80,
            fair: 70,
            poor: 60
        };
    }

    /**
     * 원본 분석 결과 설정
     * @param {Object} analysis - 원본 분석 결과
     */
    setOriginalAnalysis(analysis) {
        this.originalAnalysis = analysis;
        console.log('📊 원본 분석 결과 설정:', analysis);
    }

    /**
     * 연주 분석 결과 설정
     * @param {Object} analysis - 연주 분석 결과
     */
    setRecordingAnalysis(analysis) {
        this.recordingAnalysis = analysis;
        console.log('🎤 연주 분석 결과 설정:', analysis);
    }

    /**
     * 비교 분석 수행
     * @param {Object} recordingAnalysis - 연주 분석 결과
     * @returns {Promise<Object>} 비교 결과
     */
    async compare(recordingAnalysis) {
        try {
            console.log('🤖 AI 비교 분석 시작...');
            
            this.recordingAnalysis = recordingAnalysis;
            
            if (!this.originalAnalysis) {
                throw new Error('원본 분석 결과가 설정되지 않았습니다.');
            }

            // 각 영역별 비교 분석
            const pitchComparison = this.comparePitch();
            const rhythmComparison = this.compareRhythm();
            const timbreComparison = this.compareTimbre();

            // 종합 점수 계산
            const totalScore = this.calculateTotalScore(
                pitchComparison.score,
                rhythmComparison.score,
                timbreComparison.score
            );

            // 피드백 생성
            const feedback = this.generateFeedback(
                pitchComparison,
                rhythmComparison,
                timbreComparison,
                totalScore
            );

            // 결과 구성
            this.comparisonResults = {
                totalScore: Math.round(totalScore),
                pitchAccuracy: Math.round(pitchComparison.score),
                rhythmAccuracy: Math.round(rhythmComparison.score),
                timbreSimilarity: Math.round(timbreComparison.score),
                pitchDetails: pitchComparison,
                rhythmDetails: rhythmComparison,
                timbreDetails: timbreComparison,
                feedback: feedback,
                grade: Utils.getScoreGrade(totalScore),
                timestamp: new Date().toISOString()
            };

            console.log('✅ AI 비교 분석 완료:', this.comparisonResults);
            return this.comparisonResults;

        } catch (error) {
            console.error('AI 비교 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 피치(음정) 비교 분석
     * @returns {Object} 피치 비교 결과
     */
    comparePitch() {
        try {
            const originalPitch = this.originalAnalysis.pitchData || [];
            const recordingPitch = this.recordingAnalysis.pitchData || [];

            if (originalPitch.length === 0 || recordingPitch.length === 0) {
                return {
                    score: 0,
                    accuracy: 0,
                    details: '피치 데이터가 부족합니다.',
                    issues: ['피치 분석 데이터가 충분하지 않습니다.']
                };
            }

            // 피치 정확도 계산
            const accuracy = this.calculatePitchAccuracy(originalPitch, recordingPitch);
            
            // 피치 안정성 평가
            const stability = this.evaluatePitchStability(recordingPitch);
            
            // 음정 오류 분석
            const pitchErrors = this.analyzePitchErrors(originalPitch, recordingPitch);

            const score = Math.round(accuracy * 0.7 + stability * 0.3);

            return {
                score: score,
                accuracy: accuracy,
                stability: stability,
                pitchErrors: pitchErrors,
                details: this.generatePitchDetails(accuracy, stability, pitchErrors),
                issues: this.identifyPitchIssues(pitchErrors, accuracy)
            };

        } catch (error) {
            console.warn('피치 비교 분석 오류:', error);
            return {
                score: 0,
                accuracy: 0,
                details: '피치 분석 중 오류가 발생했습니다.',
                issues: ['피치 분석을 수행할 수 없습니다.']
            };
        }
    }

    /**
     * 피치 정확도 계산
     * @param {Array} originalPitch - 원본 피치 데이터
     * @param {Array} recordingPitch - 연주 피치 데이터
     * @returns {number} 정확도 (0-100)
     */
    calculatePitchAccuracy(originalPitch, recordingPitch) {
        let correctNotes = 0;
        let totalComparisons = 0;

        // 시간 기반 매칭
        for (const original of originalPitch) {
            const matchingRecording = this.findClosestPitch(original, recordingPitch);
            
            if (matchingRecording) {
                const originalFreq = original.frequency;
                const recordingFreq = matchingRecording.frequency;
                
                // 반음 차이 허용 (약 6% 차이)
                const semitoneRatio = Math.pow(2, 1/12);
                const tolerance = semitoneRatio - 1;
                
                const frequencyRatio = Math.abs(recordingFreq - originalFreq) / originalFreq;
                
                if (frequencyRatio <= tolerance) {
                    correctNotes++;
                }
                
                totalComparisons++;
            }
        }

        return totalComparisons > 0 ? (correctNotes / totalComparisons) * 100 : 0;
    }

    /**
     * 가장 가까운 피치 찾기
     * @param {Object} targetPitch - 대상 피치
     * @param {Array} pitchArray - 피치 배열
     * @returns {Object|null} 가장 가까운 피치
     */
    findClosestPitch(targetPitch, pitchArray) {
        let closest = null;
        let minDistance = Infinity;
        const timeTolerance = 0.1; // 100ms

        for (const pitch of pitchArray) {
            const timeDistance = Math.abs(pitch.time - targetPitch.time);
            
            if (timeDistance <= timeTolerance && timeDistance < minDistance) {
                minDistance = timeDistance;
                closest = pitch;
            }
        }

        return closest;
    }

    /**
     * 피치 안정성 평가
     * @param {Array} pitchData - 피치 데이터
     * @returns {number} 안정성 점수 (0-100)
     */
    evaluatePitchStability(pitchData) {
        if (pitchData.length < 2) return 0;

        const frequencies = pitchData.map(p => p.frequency).filter(f => f > 0);
        
        if (frequencies.length < 2) return 0;

        // 주파수 변화량 계산
        const variations = [];
        for (let i = 1; i < frequencies.length; i++) {
            const variation = Math.abs(frequencies[i] - frequencies[i - 1]) / frequencies[i - 1];
            variations.push(variation);
        }

        // 평균 변화량
        const avgVariation = Utils.calculateAverage(variations);
        
        // 안정성 점수 (변화량이 적을수록 높은 점수)
        const stability = Math.max(0, 100 - (avgVariation * 1000));
        
        return Math.min(100, stability);
    }

    /**
     * 음정 오류 분석
     * @param {Array} originalPitch - 원본 피치
     * @param {Array} recordingPitch - 연주 피치
     * @returns {Array} 오류 목록
     */
    analyzePitchErrors(originalPitch, recordingPitch) {
        const errors = [];

        for (const original of originalPitch) {
            const matching = this.findClosestPitch(original, recordingPitch);
            
            if (matching) {
                const originalNote = original.note;
                const recordingNote = matching.note;
                
                if (originalNote !== recordingNote) {
                    const semitoneDiff = this.calculateSemitoneDifference(
                        original.frequency, 
                        matching.frequency
                    );
                    
                    errors.push({
                        time: original.time,
                        expected: originalNote,
                        actual: recordingNote,
                        semitoneDiff: semitoneDiff,
                        severity: Math.abs(semitoneDiff)
                    });
                }
            }
        }

        return errors;
    }

    /**
     * 반음 차이 계산
     * @param {number} freq1 - 주파수 1
     * @param {number} freq2 - 주파수 2
     * @returns {number} 반음 차이
     */
    calculateSemitoneDifference(freq1, freq2) {
        return Math.round(12 * Math.log2(freq2 / freq1));
    }

    /**
     * 리듬 비교 분석
     * @returns {Object} 리듬 비교 결과
     */
    compareRhythm() {
        try {
            const originalRhythm = this.originalAnalysis.rhythmData || [];
            const recordingRhythm = this.recordingAnalysis.rhythmData || [];

            if (originalRhythm.length === 0 || recordingRhythm.length === 0) {
                return {
                    score: 0,
                    accuracy: 0,
                    details: '리듬 데이터가 부족합니다.',
                    issues: ['리듬 분석 데이터가 충분하지 않습니다.']
                };
            }

            // 템포 정확도
            const tempoAccuracy = this.compareTempo();
            
            // 비트 정확도
            const beatAccuracy = this.compareBeatTiming(originalRhythm, recordingRhythm);
            
            // 리듬 패턴 유사도
            const patternSimilarity = this.compareRhythmPatterns(originalRhythm, recordingRhythm);

            const score = Math.round(
                tempoAccuracy * 0.4 + 
                beatAccuracy * 0.4 + 
                patternSimilarity * 0.2
            );

            return {
                score: score,
                tempoAccuracy: tempoAccuracy,
                beatAccuracy: beatAccuracy,
                patternSimilarity: patternSimilarity,
                details: this.generateRhythmDetails(tempoAccuracy, beatAccuracy, patternSimilarity),
                issues: this.identifyRhythmIssues(tempoAccuracy, beatAccuracy, patternSimilarity)
            };

        } catch (error) {
            console.warn('리듬 비교 분석 오류:', error);
            return {
                score: 0,
                accuracy: 0,
                details: '리듬 분석 중 오류가 발생했습니다.',
                issues: ['리듬 분석을 수행할 수 없습니다.']
            };
        }
    }

    /**
     * 템포 비교
     * @returns {number} 템포 정확도 (0-100)
     */
    compareTempo() {
        const originalTempo = this.originalAnalysis.tempo;
        const recordingTempo = this.recordingAnalysis.tempo;

        if (!originalTempo || !recordingTempo) return 0;

        const tempoDiff = Math.abs(recordingTempo - originalTempo);
        const tempoAccuracy = Math.max(0, 100 - (tempoDiff * 2)); // 1 BPM 차이당 2점 감점

        return Math.min(100, tempoAccuracy);
    }

    /**
     * 비트 타이밍 비교
     * @param {Array} originalRhythm - 원본 리듬
     * @param {Array} recordingRhythm - 연주 리듬
     * @returns {number} 비트 정확도 (0-100)
     */
    compareBeatTiming(originalRhythm, recordingRhythm) {
        let correctBeats = 0;
        let totalBeats = originalRhythm.length;

        for (const originalBeat of originalRhythm) {
            const matchingBeat = this.findClosestBeat(originalBeat, recordingRhythm);
            
            if (matchingBeat) {
                const timeDiff = Math.abs(matchingBeat.beatTime - originalBeat.beatTime);
                const tolerance = 0.1; // 100ms 허용
                
                if (timeDiff <= tolerance) {
                    correctBeats++;
                }
            }
        }

        return totalBeats > 0 ? (correctBeats / totalBeats) * 100 : 0;
    }

    /**
     * 가장 가까운 비트 찾기
     * @param {Object} targetBeat - 대상 비트
     * @param {Array} beatArray - 비트 배열
     * @returns {Object|null} 가장 가까운 비트
     */
    findClosestBeat(targetBeat, beatArray) {
        let closest = null;
        let minDistance = Infinity;

        for (const beat of beatArray) {
            const distance = Math.abs(beat.beatTime - targetBeat.beatTime);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = beat;
            }
        }

        return closest;
    }

    /**
     * 리듬 패턴 비교
     * @param {Array} originalRhythm - 원본 리듬
     * @param {Array} recordingRhythm - 연주 리듬
     * @returns {number} 패턴 유사도 (0-100)
     */
    compareRhythmPatterns(originalRhythm, recordingRhythm) {
        if (originalRhythm.length < 2 || recordingRhythm.length < 2) return 0;

        // 비트 간격 패턴 추출
        const originalIntervals = originalRhythm.map(r => r.interval);
        const recordingIntervals = recordingRhythm.map(r => r.interval);

        // 패턴 정규화
        const normalizedOriginal = this.normalizePattern(originalIntervals);
        const normalizedRecording = this.normalizePattern(recordingIntervals);

        // 상관계수 계산
        const correlation = Utils.calculateCorrelation(normalizedOriginal, normalizedRecording);
        
        return Math.max(0, (correlation + 1) * 50); // -1~1을 0~100으로 변환
    }

    /**
     * 패턴 정규화
     * @param {Array} pattern - 패턴 배열
     * @returns {Array} 정규화된 패턴
     */
    normalizePattern(pattern) {
        const mean = Utils.calculateAverage(pattern);
        const std = Utils.calculateStandardDeviation(pattern);
        
        if (std === 0) return pattern.map(() => 0);
        
        return pattern.map(val => (val - mean) / std);
    }

    /**
     * 음색 비교 분석
     * @returns {Object} 음색 비교 결과
     */
    compareTimbre() {
        try {
            const originalTimbre = this.originalAnalysis.timbreData || [];
            const recordingTimbre = this.recordingAnalysis.timbreData || [];

            if (originalTimbre.length === 0 || recordingTimbre.length === 0) {
                return {
                    score: 0,
                    similarity: 0,
                    details: '음색 데이터가 부족합니다.',
                    issues: ['음색 분석 데이터가 충분하지 않습니다.']
                };
            }

            // MFCC 유사도 계산
            const mfccSimilarity = this.compareMFCC(originalTimbre, recordingTimbre);
            
            // 스펙트럼 유사도
            const spectralSimilarity = this.compareSpectralCharacteristics();
            
            // 하모닉 구조 비교
            const harmonicSimilarity = this.compareHarmonicStructure();

            const score = Math.round(
                mfccSimilarity * 0.5 + 
                spectralSimilarity * 0.3 + 
                harmonicSimilarity * 0.2
            );

            return {
                score: score,
                mfccSimilarity: mfccSimilarity,
                spectralSimilarity: spectralSimilarity,
                harmonicSimilarity: harmonicSimilarity,
                details: this.generateTimbreDetails(mfccSimilarity, spectralSimilarity, harmonicSimilarity),
                issues: this.identifyTimbreIssues(mfccSimilarity, spectralSimilarity, harmonicSimilarity)
            };

        } catch (error) {
            console.warn('음색 비교 분석 오류:', error);
            return {
                score: 0,
                similarity: 0,
                details: '음색 분석 중 오류가 발생했습니다.',
                issues: ['음색 분석을 수행할 수 없습니다.']
            };
        }
    }

    /**
     * MFCC 비교
     * @param {Array} originalTimbre - 원본 음색
     * @param {Array} recordingTimbre - 연주 음색
     * @returns {number} MFCC 유사도 (0-100)
     */
    compareMFCC(originalTimbre, recordingTimbre) {
        let totalSimilarity = 0;
        let comparisons = 0;

        for (const original of originalTimbre) {
            const matching = this.findClosestTimbre(original, recordingTimbre);
            
            if (matching) {
                const correlation = Utils.calculateCorrelation(original.mfcc, matching.mfcc);
                totalSimilarity += (correlation + 1) * 50; // -1~1을 0~100으로 변환
                comparisons++;
            }
        }

        return comparisons > 0 ? totalSimilarity / comparisons : 0;
    }

    /**
     * 가장 가까운 음색 찾기
     * @param {Object} targetTimbre - 대상 음색
     * @param {Array} timbreArray - 음색 배열
     * @returns {Object|null} 가장 가까운 음색
     */
    findClosestTimbre(targetTimbre, timbreArray) {
        let closest = null;
        let minDistance = Infinity;
        const timeTolerance = 0.2; // 200ms

        for (const timbre of timbreArray) {
            const timeDistance = Math.abs(timbre.time - targetTimbre.time);
            
            if (timeDistance <= timeTolerance && timeDistance < minDistance) {
                minDistance = timeDistance;
                closest = timbre;
            }
        }

        return closest;
    }

    /**
     * 스펙트럼 특성 비교
     * @returns {number} 스펙트럼 유사도 (0-100)
     */
    compareSpectralCharacteristics() {
        // 간단한 구현 (실제로는 더 정교한 스펙트럼 분석 필요)
        const originalVolume = this.originalAnalysis.volumeData || [];
        const recordingVolume = this.recordingAnalysis.volumeData || [];

        if (originalVolume.length === 0 || recordingVolume.length === 0) return 0;

        const originalRMS = originalVolume.map(v => v.rms);
        const recordingRMS = recordingVolume.map(v => v.rms);

        const correlation = Utils.calculateCorrelation(originalRMS, recordingRMS);
        
        return Math.max(0, (correlation + 1) * 50);
    }

    /**
     * 하모닉 구조 비교
     * @returns {number} 하모닉 유사도 (0-100)
     */
    compareHarmonicStructure() {
        // 간단한 구현 (실제로는 하모닉 분석 필요)
        return Math.random() * 100; // 임시 구현
    }

    /**
     * 종합 점수 계산
     * @param {number} pitchScore - 피치 점수
     * @param {number} rhythmScore - 리듬 점수
     * @param {number} timbreScore - 음색 점수
     * @returns {number} 종합 점수
     */
    calculateTotalScore(pitchScore, rhythmScore, timbreScore) {
        return (
            pitchScore * this.weights.pitch +
            rhythmScore * this.weights.rhythm +
            timbreScore * this.weights.timbre
        );
    }

    /**
     * 피드백 생성
     * @param {Object} pitchComparison - 피치 비교 결과
     * @param {Object} rhythmComparison - 리듬 비교 결과
     * @param {Object} timbreComparison - 음색 비교 결과
     * @param {number} totalScore - 종합 점수
     * @returns {Object} 피드백
     */
    generateFeedback(pitchComparison, rhythmComparison, timbreComparison, totalScore) {
        const feedback = {
            overall: this.generateOverallFeedback(totalScore),
            improvements: this.generateImprovements(pitchComparison, rhythmComparison, timbreComparison),
            strengths: this.generateStrengths(pitchComparison, rhythmComparison, timbreComparison),
            specific: {
                pitch: this.generatePitchDetails(pitchComparison.score, pitchComparison.stability, pitchComparison.pitchErrors),
                rhythm: this.generateRhythmDetails(rhythmComparison.tempoAccuracy, rhythmComparison.beatAccuracy, rhythmComparison.patternSimilarity),
                timbre: this.generateTimbreDetails(timbreComparison.mfccSimilarity, timbreComparison.spectralSimilarity, timbreComparison.harmonicSimilarity)
            }
        };

        return feedback;
    }

    /**
     * 전체 피드백 생성
     * @param {number} totalScore - 종합 점수
     * @returns {string} 전체 피드백
     */
    generateOverallFeedback(totalScore) {
        if (totalScore >= this.scoreThresholds.excellent) {
            return "훌륭한 연주입니다! 음정, 리듬, 음색 모두 매우 정확하게 표현되었습니다.";
        } else if (totalScore >= this.scoreThresholds.good) {
            return "좋은 연주입니다. 몇 가지 개선점이 있지만 전반적으로 잘 연주되었습니다.";
        } else if (totalScore >= this.scoreThresholds.fair) {
            return "보통 수준의 연주입니다. 더 많은 연습이 필요합니다.";
        } else if (totalScore >= this.scoreThresholds.poor) {
            return "기본적인 연습이 더 필요합니다. 천천히 정확하게 연주해보세요.";
        } else {
            return "많은 연습이 필요합니다. 기본기를 탄탄히 다져보세요.";
        }
    }

    /**
     * 개선점 생성
     * @param {Object} pitchComparison - 피치 비교 결과
     * @param {Object} rhythmComparison - 리듬 비교 결과
     * @param {Object} timbreComparison - 음색 비교 결과
     * @returns {string} 개선점
     */
    generateImprovements(pitchComparison, rhythmComparison, timbreComparison) {
        const improvements = [];

        if (pitchComparison.score < 80) {
            improvements.push("음정 정확도를 높이기 위해 스케일 연습을 더 해보세요.");
        }
        if (rhythmComparison.score < 80) {
            improvements.push("리듬을 정확하게 맞추기 위해 메트로놈과 함께 연습해보세요.");
        }
        if (timbreComparison.score < 80) {
            improvements.push("음색 표현을 위해 터치와 페달링을 개선해보세요.");
        }

        return improvements.length > 0 ? improvements.join(" ") : "특별한 개선점이 없습니다.";
    }

    /**
     * 장점 생성
     * @param {Object} pitchComparison - 피치 비교 결과
     * @param {Object} rhythmComparison - 리듬 비교 결과
     * @param {Object} timbreComparison - 음색 비교 결과
     * @returns {string} 장점
     */
    generateStrengths(pitchComparison, rhythmComparison, timbreComparison) {
        const strengths = [];

        if (pitchComparison.score >= 90) {
            strengths.push("음정이 매우 정확합니다.");
        }
        if (rhythmComparison.score >= 90) {
            strengths.push("리듬감이 뛰어납니다.");
        }
        if (timbreComparison.score >= 90) {
            strengths.push("음색 표현이 훌륭합니다.");
        }

        return strengths.length > 0 ? strengths.join(" ") : "꾸준한 연습을 통해 발전하고 있습니다.";
    }

    /**
     * 피치 상세 정보 생성
     * @param {number} accuracy - 정확도
     * @param {number} stability - 안정성
     * @param {Array} pitchErrors - 피치 오류
     * @returns {string} 피치 상세 정보
     */
    generatePitchDetails(accuracy, stability, pitchErrors) {
        let details = `음정 정확도: ${Math.round(accuracy)}%, 안정성: ${Math.round(stability)}%`;
        
        if (pitchErrors && pitchErrors.length > 0) {
            const avgError = Utils.calculateAverage(pitchErrors.map(e => e.severity));
            details += `. 평균 음정 오류: ${avgError.toFixed(1)} 반음`;
        }
        
        return details;
    }

    /**
     * 리듬 상세 정보 생성
     * @param {number} tempoAccuracy - 템포 정확도
     * @param {number} beatAccuracy - 비트 정확도
     * @param {number} patternSimilarity - 패턴 유사도
     * @returns {string} 리듬 상세 정보
     */
    generateRhythmDetails(tempoAccuracy, beatAccuracy, patternSimilarity) {
        return `템포 정확도: ${Math.round(tempoAccuracy)}%, 비트 정확도: ${Math.round(beatAccuracy)}%, 패턴 유사도: ${Math.round(patternSimilarity)}%`;
    }

    /**
     * 음색 상세 정보 생성
     * @param {number} mfccSimilarity - MFCC 유사도
     * @param {number} spectralSimilarity - 스펙트럼 유사도
     * @param {number} harmonicSimilarity - 하모닉 유사도
     * @returns {string} 음색 상세 정보
     */
    generateTimbreDetails(mfccSimilarity, spectralSimilarity, harmonicSimilarity) {
        return `MFCC 유사도: ${Math.round(mfccSimilarity)}%, 스펙트럼 유사도: ${Math.round(spectralSimilarity)}%, 하모닉 유사도: ${Math.round(harmonicSimilarity)}%`;
    }

    /**
     * 피치 문제점 식별
     * @param {Array} pitchErrors - 피치 오류
     * @param {number} accuracy - 정확도
     * @returns {Array} 문제점 목록
     */
    identifyPitchIssues(pitchErrors, accuracy) {
        const issues = [];

        if (accuracy < 70) {
            issues.push("음정이 많이 틀렸습니다.");
        }
        if (pitchErrors && pitchErrors.length > 0) {
            const largeErrors = pitchErrors.filter(e => e.severity > 2);
            if (largeErrors.length > 0) {
                issues.push("큰 음정 오류가 여러 번 발생했습니다.");
            }
        }

        return issues;
    }

    /**
     * 리듬 문제점 식별
     * @param {number} tempoAccuracy - 템포 정확도
     * @param {number} beatAccuracy - 비트 정확도
     * @param {number} patternSimilarity - 패턴 유사도
     * @returns {Array} 문제점 목록
     */
    identifyRhythmIssues(tempoAccuracy, beatAccuracy, patternSimilarity) {
        const issues = [];

        if (tempoAccuracy < 70) {
            issues.push("템포가 많이 달랐습니다.");
        }
        if (beatAccuracy < 70) {
            issues.push("비트 타이밍이 부정확했습니다.");
        }
        if (patternSimilarity < 70) {
            issues.push("리듬 패턴이 원본과 많이 달랐습니다.");
        }

        return issues;
    }

    /**
     * 음색 문제점 식별
     * @param {number} mfccSimilarity - MFCC 유사도
     * @param {number} spectralSimilarity - 스펙트럼 유사도
     * @param {number} harmonicSimilarity - 하모닉 유사도
     * @returns {Array} 문제점 목록
     */
    identifyTimbreIssues(mfccSimilarity, spectralSimilarity, harmonicSimilarity) {
        const issues = [];

        if (mfccSimilarity < 70) {
            issues.push("음색 특성이 원본과 많이 달랐습니다.");
        }
        if (spectralSimilarity < 70) {
            issues.push("스펙트럼 특성이 원본과 달랐습니다.");
        }

        return issues;
    }

    /**
     * 분석 결과 가져오기
     * @returns {Object|null} 분석 결과
     */
    getResults() {
        return this.comparisonResults;
    }

    /**
     * 분석 결과 초기화
     */
    reset() {
        this.originalAnalysis = null;
        this.recordingAnalysis = null;
        this.comparisonResults = null;
        console.log('🔄 AIComparison 초기화 완료');
    }
}

// 전역으로 사용할 수 있도록 window 객체에 추가
window.AIComparison = AIComparison;

// ES6 모듈로도 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIComparison;
} 