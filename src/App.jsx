import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const App = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const intervalRef = useRef(null);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false });
  const canvasWidth = 800;
  const canvasHeight = 500;

  const paddleWidth = 100;
  const paddleHeight = 14;
  const paddle = useRef({ x: (canvasWidth - paddleWidth) / 2 });

  const ball = useRef({ x: canvasWidth / 2, y: canvasHeight - 30, dx: 3.5, dy: -3.5 });

  const brick = {
    rowCount: 6,
    columnCount: 8,
    width: 80,
    height: 20,
    padding: 8,
    topOffset: 60,
    leftOffset: 40,
  };

  const bricks = useRef([]);

  const initBricks = () => {
    const arr = [];
    for (let c = 0; c < brick.columnCount; c++) {
      arr[c] = [];
      for (let r = 0; r < brick.rowCount; r++) {
        arr[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
    bricks.current = arr;
  };

  useEffect(() => {
    initBricks();

    const handleKeyDown = (e) => {
      if (e.key in keys.current) keys.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      if (e.key in keys.current) keys.current[e.key] = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      if (mouseX > 0 && mouseX < canvasWidth) {
        paddle.current.x = mouseX - paddleWidth / 2;
      }
    };

    const handleTouchMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      if (touchX > 0 && touchX < canvasWidth) {
        paddle.current.x = touchX - paddleWidth / 2;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const resetBall = () => {
    ball.current = {
      x: canvasWidth / 2,
      y: canvasHeight - 30,
      dx: 3.5,
      dy: -3.5,
    };
  };

  const resetGame = () => {
    setMessage('');
    setShowPopup(false);
    resetBall();
    paddle.current.x = (canvasWidth - paddleWidth) / 2;
    initBricks();
    setIsRunning(false);
    clearInterval(intervalRef.current);
    startGame();
  };

  const startGame = () => {
    if (!isRunning) {
      if (showPopup) {
        resetGame();
      }
      intervalRef.current = setInterval(draw, 16);
      setIsRunning(true);
    }
  };

  const togglePauseGame = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(draw, 16);
    }
    setIsRunning(!isRunning);
  };

  const endGame = (msg) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMessage(msg);
    setShowPopup(true);
  };

  const draw = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (keys.current.ArrowLeft) paddle.current.x -= 6;
    if (keys.current.ArrowRight) paddle.current.x += 6;
    paddle.current.x = Math.max(0, Math.min(canvasWidth - paddleWidth, paddle.current.x));

    let remaining = 0;
    for (let c = 0; c < brick.columnCount; c++) {
      for (let r = 0; r < brick.rowCount; r++) {
        const b = bricks.current[c][r];
        if (b.status === 1) {
          const brickX = c * (brick.width + brick.padding) + brick.leftOffset;
          const brickY = r * (brick.height + brick.padding) + brick.topOffset;
          b.x = brickX;
          b.y = brickY;

          ctx.beginPath();
          ctx.roundRect(brickX, brickY, brick.width, brick.height, 4);
          ctx.fillStyle = '#374151';
          ctx.fill();
          ctx.closePath();

          if (
            ball.current.x + 10 > b.x &&
            ball.current.x - 10 < b.x + brick.width &&
            ball.current.y + 10 > b.y &&
            ball.current.y - 10 < b.y + brick.height
          ) {
            ball.current.dy = -ball.current.dy;
            b.status = 0;
          } else {
            remaining++;
          }
        }
      }
    }

    if (remaining === 0) endGame('You Win!');

    ctx.beginPath();
    ctx.roundRect(paddle.current.x, canvasHeight - paddleHeight, paddleWidth, paddleHeight, 8);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    ctx.closePath();

    ball.current.x += ball.current.dx;
    ball.current.y += ball.current.dy;

    if (ball.current.x < 10 || ball.current.x > canvasWidth - 10) ball.current.dx = -ball.current.dx;
    if (ball.current.y < 10) ball.current.dy = -ball.current.dy;

    if (
      ball.current.dy > 0 &&
      ball.current.y + 10 >= canvasHeight - paddleHeight &&
      ball.current.x > paddle.current.x &&
      ball.current.x < paddle.current.x + paddleWidth
    ) {
      ball.current.dy = -Math.abs(ball.current.dy);
    }

    if (ball.current.y > canvasHeight) {
      resetBall();
    }
  };

  return (
    <div className="app">
      <h1 className="title">Breakout</h1>

      <div className="container">
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}></canvas>

        <div className="controls">
          <button onClick={startGame}>
            Start
          </button>
          <button onClick={togglePauseGame}>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={resetGame}>
            New Game
          </button>
        </div>

        <p className="instructions">
          Use mouse, touch, or arrow keys to move the paddle
        </p>
      </div>

      {showPopup && (
        <div className="popup">
          <div className="popup-inner">
            <p>{message}</p>
            <button onClick={() => setShowPopup(false)}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
