class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.scores = {
            X: 0,
            O: 0,
            draw: 0
        };
        
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], 
            [0, 3, 6], [1, 4, 7], [2, 5, 8], 
            [0, 4, 8], [2, 4, 6]           
        ];
        
        this.audioContext = null;
        this.soundEnabled = true;
        this.volume = 0.5;
        this.bgMusicEnabled = false;
        
        this.init();
    }

    init() {
        this.initAudio();
        this.showLoader();
        
        setTimeout(() => {
            this.hideLoader();
            this.initGame();
            this.initSettings();
        }, 3000);
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playSound(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playMoveSound() {
        this.playSound(800, 0.1, 'sine');
    }

    playWinSound() {
        this.playSound(523, 0.2, 'sine');
        setTimeout(() => this.playSound(659, 0.2, 'sine'), 200);
        setTimeout(() => this.playSound(784, 0.3, 'sine'), 400);
    }

    playDrawSound() {
        this.playSound(400, 0.3, 'triangle');
    }

    initSettings() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const soundToggle = document.getElementById('soundToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.querySelector('.volume-value');
        const bgMusicToggle = document.getElementById('bgMusicToggle');

        this.loadSettings();
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
        });
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });


        soundToggle.checked = this.soundEnabled;
        soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveSettings();
        });

        volumeSlider.value = this.volume * 100;
        volumeValue.textContent = Math.round(this.volume * 100) + '%';
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            volumeValue.textContent = e.target.value + '%';
            this.saveSettings();
        });

        bgMusicToggle.checked = this.bgMusicEnabled;
        bgMusicToggle.addEventListener('change', (e) => {
            this.bgMusicEnabled = e.target.checked;
            this.saveSettings();
            if (this.bgMusicEnabled) {
                this.startBackgroundMusic();
            } else {
                this.stopBackgroundMusic();
            }
        });
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('ticTacToeSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
            this.volume = settings.volume !== undefined ? settings.volume : 0.5;
            this.bgMusicEnabled = settings.bgMusicEnabled !== undefined ? settings.bgMusicEnabled : false;
        }
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            volume: this.volume,
            bgMusicEnabled: this.bgMusicEnabled
        };
        localStorage.setItem('ticTacToeSettings', JSON.stringify(settings));
    }

    startBackgroundMusic() {
        if (!this.audioContext || !this.bgMusicEnabled) return;
        
        this.bgMusicInterval = setInterval(() => {
            if (this.bgMusicEnabled) {
                this.playSound(440 + Math.random() * 100, 0.5, 'sine');
            }
        }, 2000);
    }

    stopBackgroundMusic() {
        if (this.bgMusicInterval) {
            clearInterval(this.bgMusicInterval);
            this.bgMusicInterval = null;
        }
    }

    showLoader() {
        const loader = document.getElementById('loader');
        const gameContainer = document.getElementById('gameContainer');
        loader.style.display = 'flex';
        gameContainer.style.display = 'none';
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        const gameContainer = document.getElementById('gameContainer');
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            gameContainer.style.display = 'block';
        }, 500);
    }

    initGame() {
        this.squares = document.querySelectorAll('.square');
        this.status = document.getElementById('status');
        this.resetBtn = document.getElementById('resetBtn');
        this.scoreX = document.getElementById('scoreX');
        this.scoreO = document.getElementById('scoreO');
        this.scoreDraw = document.getElementById('scoreDraw');

        this.squares.forEach((square, i) => {
            square.addEventListener('click', () => this.makeMove(i));
        });

        this.resetBtn.addEventListener('click', () => this.reset());
        this.updateStatus();
        this.updateScores();
    }

    makeMove(index) {
        if (this.board[index] || !this.gameActive) return;

        this.board[index] = this.currentPlayer;
        this.squares[index].textContent = this.currentPlayer;
        this.squares[index].classList.add(this.currentPlayer.toLowerCase());

        
        this.playMoveSound();

        const winResult = this.checkWin();
        if (winResult) {
            this.gameActive = false;
            this.status.textContent = `Player ${this.currentPlayer} wins!`;
            this.status.classList.add('winner');
            this.highlightWinningSquares(winResult.pattern, winResult.type);
            this.scores[this.currentPlayer]++;
            this.updateScores();
            
            // Play win sound
            this.playWinSound();
        } else if (this.board.every(cell => cell)) {
            this.gameActive = false;
            this.status.textContent = "It's a draw!";
            this.status.classList.add('draw');
            this.scores.draw++;
            this.updateScores();
            
            // Play draw sound
            this.playDrawSound();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
        }
    }

    updateScores() {
        this.scoreX.textContent = this.scores.X;
        this.scoreO.textContent = this.scores.O;
        this.scoreDraw.textContent = this.scores.draw;
    }

    checkWin() {
        for (let i = 0; i < this.winPatterns.length; i++) {
            const pattern = this.winPatterns[i];
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                return {
                    pattern,
                    type: i < 3 ? 'horizontal' : 
                          i < 6 ? 'vertical' : 
                          i === 6 ? 'diagonal-1' : 'diagonal-2'
                };
            }
        }
        return null;
    }

    highlightWinningSquares(pattern, type) {
        pattern.forEach(index => {
            this.squares[index].classList.add('winning-square');
        });
    }

    updateStatus() {
        this.status.textContent = `Player ${this.currentPlayer}'s turn`;
        this.status.className = 'status current-player';
    }

    reset() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        this.squares.forEach(square => {
            square.textContent = '';
            square.classList.remove('winning-square', 'x', 'o');
        });
        
        this.updateStatus();
        this.playSound(600, 0.2, 'sine');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});