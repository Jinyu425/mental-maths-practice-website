import { useState, useEffect, useCallback } from 'react';
import { Calculator, Timer, TrendingUp, Settings, Heart, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
type Mode = 'primary' | 'advanced';

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

interface Stats {
  correct: number;
  incorrect: number;
  totalTime: number;
  problemsSolved: number;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('primary');
  const [selectedOps, setSelectedOps] = useState<Operation[]>(['addition', 'subtraction', 'multiplication', 'division']);
  const [difficulty, setDifficulty] = useState<'medium' | 'hard'>('medium');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [stats, setStats] = useState<Stats>({ correct: 0, incorrect: 0, totalTime: 0, problemsSolved: 0 });
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showBoldTime, setShowBoldTime] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [problemCount, setProblemCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [progressView, setProgressView] = useState<'7days' | '30days'>('7days');
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [showProgress, setShowProgress] = useState(false);

  // Load and save progress data
  const getProgressData = () => {
    const stored = localStorage.getItem('mathTrainerProgress');
    return stored ? JSON.parse(stored) : {};
  };

  const saveQuestionCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const data = getProgressData();
    data[today] = (data[today] || 0) + 1;
    localStorage.setItem('mathTrainerProgress', JSON.stringify(data));
  };

  const getTodayCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const data = getProgressData();
    return data[today] || 0;
  };

  const getChartData = () => {
    const days = progressView === '7days' ? 7 : 30;
    const data = getProgressData();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result.push({
        date: label,
        questions: data[dateStr] || 0
      });
    }

    return result;
  };

  const generateProblem = useCallback((currentProblemNum: number): Problem => {
    const operation = selectedOps[Math.floor(Math.random() * selectedOps.length)];
    let num1: number, num2: number, answer: number;

    // First 3 questions are easier (warm-up)
    const isWarmup = currentProblemNum < 3;

    if (mode === 'primary') {
      // Primary mode: addition/subtraction with up to 2-digit numbers
      switch (operation) {
        case 'addition':
          if (isWarmup) {
            num1 = Math.floor(Math.random() * 40) + 10; // 10-49
            num2 = Math.floor(Math.random() * 40) + 10; // 10-49
          } else {
            num1 = Math.floor(Math.random() * 90) + 10; // 10-99
            num2 = Math.floor(Math.random() * 90) + 10; // 10-99
          }
          answer = num1 + num2;
          break;

        case 'subtraction':
          if (isWarmup) {
            num1 = Math.floor(Math.random() * 40) + 20; // 20-59
            num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
          } else {
            num1 = Math.floor(Math.random() * 90) + 10; // 10-99
            num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
          }
          answer = num1 - num2;
          break;

        case 'multiplication':
          // At most 2 digit × 1 digit
          if (isWarmup) {
            // Smaller numbers for warm-up
            num1 = Math.floor(Math.random() * 40) + 10; // 10-49 (2 digits)
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (1 digit)
          } else {
            num1 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (1 digit)
          }
          answer = num1 * num2;
          break;

        case 'division':
          // Divisor can only be single digit (1-9)
          if (isWarmup) {
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (1 digit divisor)
            answer = Math.floor(Math.random() * 9) + 1; // 1-9 (smaller quotient)
          } else {
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9 (1 digit divisor)
            answer = Math.floor(Math.random() * 20) + 1; // 1-20 (quotient)
          }
          num1 = num2 * answer;
          break;

        default:
          num1 = 0;
          num2 = 0;
          answer = 0;
      }
    } else {
      // Advanced mode
      const effectiveDifficulty = isWarmup ? 'medium' : difficulty;

      switch (operation) {
        case 'addition':
          if (isWarmup) {
            num1 = Math.floor(Math.random() * 400) + 100; // 100-499 (2-3 digits)
            num2 = Math.floor(Math.random() * 400) + 100; // 100-499 (2-3 digits)
          } else if (effectiveDifficulty === 'medium') {
            num1 = Math.floor(Math.random() * 900) + 100; // 100-999 (3 digits)
            num2 = Math.floor(Math.random() * 900) + 100; // 100-999 (3 digits)
          } else {
            // Hard: one 4-digit and one 3-digit
            num1 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999 (4 digits)
            num2 = Math.floor(Math.random() * 900) + 100; // 100-999 (3 digits)
          }
          answer = num1 + num2;
          break;

        case 'subtraction':
          if (isWarmup) {
            num1 = Math.floor(Math.random() * 400) + 100; // 100-499
            num2 = Math.floor(Math.random() * (num1 - 100)) + 50;
          } else if (effectiveDifficulty === 'medium') {
            num1 = Math.floor(Math.random() * 900) + 100; // 100-999
            num2 = Math.floor(Math.random() * (num1 - 50)) + 50;
          } else {
            // Hard: 4-digit minus 3-digit
            num1 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999 (4 digits)
            num2 = Math.floor(Math.random() * 900) + 100; // 100-999 (3 digits)
          }
          answer = num1 - num2;
          break;

        case 'multiplication':
          // Either 2 digit × 2 digit OR 2 digit × 3 digit
          const useThreeDigit = Math.random() > 0.5;

          if (useThreeDigit) {
            // 2 digit × 3 digit
            num1 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
            num2 = Math.floor(Math.random() * 900) + 100; // 100-999 (3 digits)
          } else {
            // 2 digit × 2 digit
            num1 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
            num2 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
          }
          answer = num1 * num2;
          break;

        case 'division':
          // Either 2 digit ÷ 2 digit OR 3 digit ÷ 2 digit (with whole number results)
          const useThreeDigitDiv = Math.random() > 0.5;

          if (useThreeDigitDiv) {
            // 3 digit ÷ 2 digit
            num2 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
            answer = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digit quotient)
            num1 = num2 * answer; // This creates a 3-4 digit dividend
          } else {
            // 2 digit ÷ 2 digit
            num2 = Math.floor(Math.random() * 90) + 10; // 10-99 (2 digits)
            answer = Math.floor(Math.random() * 9) + 1; // 1-9 (single digit quotient)
            num1 = num2 * answer; // This creates a 2-3 digit dividend
          }
          break;

        default:
          num1 = 0;
          num2 = 0;
          answer = 0;
      }
    }

    return { num1, num2, operation, answer };
  }, [selectedOps, difficulty, mode]);

  useEffect(() => {
    if (selectedOps.length > 0 && !currentProblem) {
      setCurrentProblem(generateProblem(problemCount));
    }
  }, [selectedOps, currentProblem, generateProblem, problemCount]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hasStarted && !gameOver && currentProblem && !feedback) {
      interval = setInterval(() => {
        setTimer((time) => time + 10);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasStarted, gameOver, currentProblem, feedback]);

  const getOperationSymbol = (op: Operation): string => {
    const symbols = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' };
    return symbols[op];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || userAnswer === '' || gameOver) return;

    const userNum = parseFloat(userAnswer);
    const isCorrect = Math.abs(userNum - currentProblem.answer) < 0.01;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      totalTime: prev.totalTime + timer,
      problemsSolved: prev.problemsSolved + 1
    }));

    // Save progress
    saveQuestionCompleted();

    if (isCorrect) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        setGameOver(true);
      }
    }

    // Show bold time briefly
    setShowBoldTime(true);

    setTimeout(() => {
      setFeedback(null);
      setUserAnswer('');
      setShowBoldTime(false);
      if (lives > 0 || isCorrect) {
        const newProblemCount = problemCount + 1;
        setProblemCount(newProblemCount);
        setCurrentProblem(generateProblem(newProblemCount));
        setTimer(0);
      }
    }, 800);
  };

  const toggleOperation = (op: Operation) => {
    setSelectedOps((prev) => {
      if (prev.includes(op)) {
        return prev.length > 1 ? prev.filter((o) => o !== op) : prev;
      }
      return [...prev, op];
    });
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setProblemCount(0);
    setStreak(0);
    setLives(3);
    setGameOver(false);
    setTimer(0);
    setUserAnswer('');
    setFeedback(null);
    setShowBoldTime(false);
    setHasStarted(false);

    // Set default operations based on mode (all operations available in both modes)
    setSelectedOps(['addition', 'subtraction', 'multiplication', 'division']);

    setCurrentProblem(null);
  };

  const resetStats = () => {
    setStats({ correct: 0, incorrect: 0, totalTime: 0, problemsSolved: 0 });
    setStreak(0);
    setTimer(0);
    setProblemCount(0);
    setCurrentProblem(generateProblem(0));
    setUserAnswer('');
    setFeedback(null);
    setLives(3);
    setGameOver(false);
    setShowBoldTime(false);
    setHasStarted(true);
  };

  const accuracy = stats.problemsSolved > 0 ? (stats.correct / stats.problemsSolved) * 100 : 0;
  const avgTime = stats.problemsSolved > 0 ? stats.totalTime / stats.problemsSolved / 1000 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calculator className="w-8 h-8" />
            <h1>Quant Math Trainer</h1>
          </div>
          <p className="text-muted-foreground">
            Sharpen your mental math skills for quantitative trading
          </p>

          {/* Mode Switcher */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => handleModeChange('primary')}
              className={`px-6 py-2 rounded-lg border transition-colors ${
                mode === 'primary'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              Primary
            </button>
            <button
              onClick={() => handleModeChange('advanced')}
              className={`px-6 py-2 rounded-lg border transition-colors ${
                mode === 'advanced'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              Advanced
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
              {!hasStarted ? (
                <div className="text-center py-20">
                  <button
                    onClick={() => setHasStarted(true)}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-lg"
                  >
                    Start Practice
                  </button>
                </div>
              ) : currentProblem && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      <span className={`font-mono transition-all ${
                        showBoldTime ? 'font-bold text-foreground scale-110' : ''
                      }`}>
                        {(timer / 1000).toFixed(2)}s
                      </span>
                      {problemCount < 3 && (
                        <span className="text-xs px-2 py-1 bg-accent rounded">Warm-up</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-5 h-5 ${
                            i < lives
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    {gameOver ? (
                      <div className="space-y-6">
                        <div className="text-4xl mb-4">💀 Game Over</div>
                        <div className="space-y-2">
                          <div className="text-muted-foreground">
                            You ran out of lives!
                          </div>
                          <div className="text-lg">
                            Final Score: <span className="font-mono">{stats.correct}</span> correct
                          </div>
                          <div className="text-lg">
                            Average Time: <span className="font-mono">{avgTime.toFixed(2)}s</span> per question
                          </div>
                        </div>
                        <button
                          onClick={resetStats}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`text-6xl font-mono mb-6 transition-all ${
                          feedback === 'correct' ? 'text-green-600' : feedback === 'incorrect' ? 'text-destructive' : ''
                        }`}>
                          {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
                          <input
                            type="number"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Your answer"
                            className="w-64 px-4 py-3 text-2xl text-center bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                            disabled={feedback !== null}
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                            disabled={feedback !== null || userAnswer === ''}
                          >
                            Submit
                          </button>
                        </form>
                      </>
                    )}
                  </div>

                  {streak >= 5 && !gameOver && (
                    <div className="text-center">
                      <span className="inline-block px-4 py-2 bg-accent rounded-full">
                        🔥 {streak} streak!
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Progress Tracking Card */}
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <h3 className="text-sm">Progress</h3>
                </div>
                <button
                  onClick={() => setShowProgress(!showProgress)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showProgress ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Today:</span>
                <span className="text-lg font-mono">{getTodayCount()}</span>
              </div>

              {showProgress && (
                <div className="space-y-2 mt-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setProgressView('7days')}
                      className={`flex-1 px-2 py-1 rounded border transition-colors text-xs ${
                        progressView === '7days'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-accent'
                      }`}
                    >
                      7d
                    </button>
                    <button
                      onClick={() => setProgressView('30days')}
                      className={`flex-1 px-2 py-1 rounded border transition-colors text-xs ${
                        progressView === '30days'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-accent'
                      }`}
                    >
                      30d
                    </button>
                    <button
                      onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                      className="px-2 py-1 rounded border border-border hover:bg-accent transition-colors text-xs"
                    >
                      {chartType === 'line' ? 'Line' : 'Bar'}
                    </button>
                  </div>

                  <ResponsiveContainer width="100%" height={120}>
                    {chartType === 'line' ? (
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 10 }}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="questions"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          dot={{ fill: 'var(--primary)', r: 3 }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          tick={{ fontSize: 10 }}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar
                          dataKey="questions"
                          fill="var(--primary)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" />
                <h2>Statistics</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-mono">{accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct</span>
                  <span className="font-mono text-green-600">{stats.correct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Incorrect</span>
                  <span className="font-mono text-destructive">{stats.incorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Time</span>
                  <span className="font-mono">{avgTime.toFixed(2)}s</span>
                </div>
              </div>
              <button
                onClick={resetStats}
                className="w-full mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Reset Stats
              </button>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" />
                <h2>Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Operations</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['addition', 'subtraction', 'multiplication', 'division'] as Operation[]).map((op) => (
                      <button
                        key={op}
                        onClick={() => toggleOperation(op)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          selectedOps.includes(op)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-accent'
                        }`}
                      >
                        {getOperationSymbol(op)} {op.charAt(0).toUpperCase() + op.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === 'advanced' && (
                  <div>
                    <label className="block mb-2">Difficulty</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['medium', 'hard'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            setDifficulty(level);
                            setCurrentProblem(null);
                          }}
                          className={`px-3 py-2 rounded-lg border transition-colors ${
                            difficulty === level
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-accent'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
