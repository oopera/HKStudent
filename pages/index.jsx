import DiceScene from "@/components/DiceScene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

export default function Home() {
  const [faceTexts, setFaceTexts] = useState(["1", "2", "3", "4", "5", "6"]);
  const [topResult, setTopResult] = useState(null);
  const diceRef = useRef(null);

  const onChangeFace = (i, value) => {
    const next = [...faceTexts];
    next[i] = value;
    setFaceTexts(next);
  };

  const rollDice = () => {
    setTopResult(null);
    if (diceRef.current && diceRef.current.roll) {
      diceRef.current.roll();
    }
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] pt-20">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="col-span-1 space-y-4 overflow-auto py-2">
          <div className="text-xl font-semibold">Dice Slots</div>
          {faceTexts.map((text, idx) => (
            <div key={idx} className="space-y-1">
              <label className="text-sm text-muted-foreground">{`Slot ${
                idx + 1
              }`}</label>
              <Input
                value={text}
                onChange={(e) => onChangeFace(idx, e.target.value)}
                placeholder={`Text for slot ${idx + 1}`}
              />
            </div>
          ))}
          <Button onClick={rollDice} className="w-full">
            Cast Dice
          </Button>
        </div>
        <div className="col-span-1 lg:col-span-2 rounded-md border bg-background h-full min-h-[420px]">
          <DiceScene
            ref={diceRef}
            texts={faceTexts}
            onResult={(r) => setTopResult(r)}
          />
        </div>
      </div>
      {topResult && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md border bg-background px-4 py-2 shadow-sm">
          {topResult.text}
        </div>
      )}
    </div>
  );
}
