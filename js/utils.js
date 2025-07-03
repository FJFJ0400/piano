/**
 * PianoAI Coach - 유틸리티 함수들
 * 공통으로 사용되는 헬퍼 함수들을 모아둔 모듈
 */

class Utils {
    /**
     * 파일 크기를 사람이 읽기 쉬운 형태로 변환
     * @param {number} bytes - 바이트 단위 파일 크기
     * @returns {string} 포맷된 파일 크기 문자열
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 초 단위 시간을 MM:SS 형태로 변환
     * @param {number} seconds - 초 단위 시간
     * @returns {string} 포맷된 시간 문자열
     */
    static formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return 'N/A';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 주파수를 음악적 음표로 변환
     * @param {number} frequency - 주파수 (Hz)
     * @returns {string} 음표 문자열 (예: "A4", "C#5")
     */
    static frequencyToNote(frequency) {
        if (!frequency || frequency <= 0) return 'N/A';
        
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / C0));
        const octave = Math.floor(halfStepsBelowMiddleC / 12);
        const noteIndex = (halfStepsBelowMiddleC % 12 + 12) % 12;
        
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        return notes[noteIndex] + octave;
    }

    /**
     * 음표를 주파수로 변환
     * @param {string} note - 음표 문자열 (예: "A4", "C#5")
     * @returns {number} 주파수 (Hz)
     */
    static noteToFrequency(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        
        const noteIndex = notes.indexOf(noteName);
        if (noteIndex === -1) return null;
        
        const A4 = 440;
        const A4Index = 9; // A는 9번째 인덱스
        const A4Octave = 4;
        
        const halfSteps = (octave - A4Octave) * 12 + (noteIndex - A4Index);
        
        return A4 * Math.pow(2, halfSteps / 12);
    }

    /**
     * 템포를 BPM으로 변환
     * @param {number} bpm - 분당 비트 수
     * @returns {object} 템포 정보
     */
    static bpmToTempo(bpm) {
        const tempoMap = {
            'Larghissimo': { min: 0, max: 24 },
            'Adagissimo': { min: 24, max: 40 },
            'Grave': { min: 25, max: 45 },
            'Largo': { min: 40, max: 60 },
            'Lento': { min: 45, max: 60 },
            'Larghetto': { min: 60, max: 66 },
            'Adagio': { min: 66, max: 76 },
            'Adagietto': { min: 70, max: 80 },
            'Andante': { min: 76, max: 108 },
            'Andantino': { min: 80, max: 108 },
            'Marcia moderato': { min: 83, max: 85 },
            'Moderato': { min: 108, max: 120 },
            'Allegretto': { min: 112, max: 120 },
            'Allegro': { min: 120, max: 156 },
            'Vivace': { min: 156, max: 176 },
            'Vivacissimo': { min: 172, max: 176 },
            'Allegrissimo': { min: 172, max: 176 },
            'Presto': { min: 168, max: 200 },
            'Prestissimo': { min: 200, max: 208 }
        };

        for (const [tempo, range] of Object.entries(tempoMap)) {
            if (bpm >= range.min && bpm <= range.max) {
                return {
                    bpm: bpm,
                    tempo: tempo,
                    description: this.getTempoDescription(tempo)
                };
            }
        }

        return {
            bpm: bpm,
            tempo: 'Unknown',
            description: '알 수 없는 템포'
        };
    }

    /**
     * 템포 설명 반환
     * @param {string} tempo - 템포명
     * @returns {string} 템포 설명
     */
    static getTempoDescription(tempo) {
        const descriptions = {
            'Larghissimo': '매우 느리게 (극히 느림)',
            'Adagissimo': '매우 느리게',
            'Grave': '무겁고 느리게',
            'Largo': '넓고 느리게',
            'Lento': '느리게',
            'Larghetto': '조금 빠르게',
            'Adagio': '느리게',
            'Adagietto': '조금 빠르게',
            'Andante': '걸어가는 속도로',
            'Andantino': '조금 빠르게',
            'Marcia moderato': '보행하는 속도로',
            'Moderato': '보통 속도로',
            'Allegretto': '조금 빠르게',
            'Allegro': '빠르게',
            'Vivace': '생동감 있게',
            'Vivacissimo': '매우 생동감 있게',
            'Allegrissimo': '매우 빠르게',
            'Presto': '매우 빠르게',
            'Prestissimo': '극히 빠르게'
        };

        return descriptions[tempo] || '알 수 없는 템포';
    }

    /**
     * 주파수 범위를 음악적 범위로 변환
     * @param {number} minFreq - 최소 주파수
     * @param {number} maxFreq - 최대 주파수
     * @returns {string} 음악적 범위 문자열
     */
    static getFrequencyRange(minFreq, maxFreq) {
        if (!minFreq || !maxFreq) return 'N/A';
        
        const minNote = this.frequencyToNote(minFreq);
        const maxNote = this.frequencyToNote(maxFreq);
        
        return `${minNote} - ${maxNote}`;
    }

    /**
     * 오디오 데이터에서 RMS (Root Mean Square) 계산
     * @param {Float32Array} audioData - 오디오 데이터 배열
     * @returns {number} RMS 값
     */
    static calculateRMS(audioData) {
        if (!audioData || audioData.length === 0) return 0;
        
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        
        return Math.sqrt(sum / audioData.length);
    }

    /**
     * 오디오 데이터에서 피크 값 계산
     * @param {Float32Array} audioData - 오디오 데이터 배열
     * @returns {number} 피크 값
     */
    static calculatePeak(audioData) {
        if (!audioData || audioData.length === 0) return 0;
        
        let peak = 0;
        for (let i = 0; i < audioData.length; i++) {
            const absValue = Math.abs(audioData[i]);
            if (absValue > peak) {
                peak = absValue;
            }
        }
        
        return peak;
    }

    /**
     * 데시벨로 변환
     * @param {number} amplitude - 진폭 값 (0-1)
     * @returns {number} 데시벨 값
     */
    static amplitudeToDecibels(amplitude) {
        if (amplitude <= 0) return -Infinity;
        return 20 * Math.log10(amplitude);
    }

    /**
     * 데시벨을 진폭으로 변환
     * @param {number} decibels - 데시벨 값
     * @returns {number} 진폭 값 (0-1)
     */
    static decibelsToAmplitude(decibels) {
        return Math.pow(10, decibels / 20);
    }

    /**
     * 배열의 평균값 계산
     * @param {Array} array - 숫자 배열
     * @returns {number} 평균값
     */
    static calculateAverage(array) {
        if (!array || array.length === 0) return 0;
        
        const sum = array.reduce((acc, val) => acc + val, 0);
        return sum / array.length;
    }

    /**
     * 배열의 표준편차 계산
     * @param {Array} array - 숫자 배열
     * @returns {number} 표준편차
     */
    static calculateStandardDeviation(array) {
        if (!array || array.length === 0) return 0;
        
        const mean = this.calculateAverage(array);
        const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
        const variance = this.calculateAverage(squaredDiffs);
        
        return Math.sqrt(variance);
    }

    /**
     * 두 배열 간의 상관계수 계산
     * @param {Array} array1 - 첫 번째 배열
     * @param {Array} array2 - 두 번째 배열
     * @returns {number} 상관계수 (-1 ~ 1)
     */
    static calculateCorrelation(array1, array2) {
        if (!array1 || !array2 || array1.length !== array2.length || array1.length === 0) {
            return 0;
        }
        
        const mean1 = this.calculateAverage(array1);
        const mean2 = this.calculateAverage(array2);
        
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < array1.length; i++) {
            const diff1 = array1[i] - mean1;
            const diff2 = array2[i] - mean2;
            
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        const denominator = Math.sqrt(denominator1 * denominator2);
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * 배열을 청크로 분할
     * @param {Array} array - 원본 배열
     * @param {number} chunkSize - 청크 크기
     * @returns {Array} 청크 배열
     */
    static chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * 배열의 중앙값 계산
     * @param {Array} array - 숫자 배열
     * @returns {number} 중앙값
     */
    static calculateMedian(array) {
        if (!array || array.length === 0) return 0;
        
        const sorted = [...array].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        } else {
            return sorted[middle];
        }
    }

    /**
     * 배열에서 최빈값 찾기
     * @param {Array} array - 배열
     * @returns {*} 최빈값
     */
    static findMode(array) {
        if (!array || array.length === 0) return null;
        
        const frequency = {};
        let maxFreq = 0;
        let mode = null;
        
        for (const item of array) {
            frequency[item] = (frequency[item] || 0) + 1;
            if (frequency[item] > maxFreq) {
                maxFreq = frequency[item];
                mode = item;
            }
        }
        
        return mode;
    }

    /**
     * 색상을 HSL로 변환
     * @param {number} hue - 색조 (0-360)
     * @param {number} saturation - 채도 (0-100)
     * @param {number} lightness - 명도 (0-100)
     * @returns {string} HSL 색상 문자열
     */
    static hsl(hue, saturation, lightness) {
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * 점수에 따른 색상 반환
     * @param {number} score - 점수 (0-100)
     * @returns {string} 색상 문자열
     */
    static getScoreColor(score) {
        if (score >= 90) return '#10b981'; // 녹색 (우수)
        if (score >= 80) return '#06b6d4'; // 청록색 (양호)
        if (score >= 70) return '#f59e0b'; // 주황색 (보통)
        if (score >= 60) return '#f97316'; // 주황색 (미흡)
        return '#ef4444'; // 빨간색 (불량)
    }

    /**
     * 점수에 따른 등급 반환
     * @param {number} score - 점수 (0-100)
     * @returns {string} 등급 문자열
     */
    static getScoreGrade(score) {
        if (score >= 95) return 'S+';
        if (score >= 90) return 'S';
        if (score >= 85) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    /**
     * 디바운스 함수
     * @param {Function} func - 실행할 함수
     * @param {number} wait - 대기 시간 (ms)
     * @returns {Function} 디바운스된 함수
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 쓰로틀 함수
     * @param {Function} func - 실행할 함수
     * @param {number} limit - 제한 시간 (ms)
     * @returns {Function} 쓰로틀된 함수
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 에러 메시지 표시
     * @param {string} message - 에러 메시지
     * @param {string} type - 메시지 타입 ('error', 'warning', 'info', 'success')
     */
    static showMessage(message, type = 'error') {
        // 간단한 알림 표시 (실제 구현에서는 더 정교한 UI 사용)
        console.error(`[${type.toUpperCase()}] ${message}`);
        
        // 브라우저 알림 사용
        if (type === 'error') {
            alert(`오류: ${message}`);
        }
    }

    /**
     * 로딩 상태 표시/숨김
     * @param {HTMLElement} element - 로딩을 표시할 요소
     * @param {boolean} show - 표시 여부
     */
    static toggleLoading(element, show) {
        if (!element) return;
        
        if (show) {
            element.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>처리 중...</p>
                </div>
            `;
        } else {
            element.innerHTML = '';
        }
    }

    /**
     * 파일 확장자 확인
     * @param {string} filename - 파일명
     * @param {Array} allowedExtensions - 허용된 확장자 배열
     * @returns {boolean} 허용 여부
     */
    static isAllowedFileType(filename, allowedExtensions) {
        const extension = filename.split('.').pop().toLowerCase();
        return allowedExtensions.includes(extension);
    }

    /**
     * 파일 크기 제한 확인
     * @param {number} fileSize - 파일 크기 (bytes)
     * @param {number} maxSize - 최대 크기 (bytes)
     * @returns {boolean} 허용 여부
     */
    static isAllowedFileSize(fileSize, maxSize) {
        return fileSize <= maxSize;
    }
}

// 전역으로 사용할 수 있도록 window 객체에 추가
window.Utils = Utils;

// ES6 모듈로도 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} 