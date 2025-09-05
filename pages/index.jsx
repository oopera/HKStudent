import DiceScene from "@/components/DiceScene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

const defaultFaceTexts = [
  "Trink ein Glas Wasser.",
  "Mache einen kleinen Spaziergang.",
  "Was ist etwas wofür du dankbar bist?",
  "Schreibe einen Brief an deinen Lieblingsmensch.",
  "Berühre eine Pflanze.",
  "Worauf freust du dich diese Woche am meisten?",
];
const defaultFaceColors = [
  "#C7017F",
  "#A2C617",
  "#FBBA00",
  "#C40C42",
  "#35B6B4",
  "#00AEEF",
];

export default function Home() {
  const [faceTexts, setFaceTexts] = useState(defaultFaceTexts);
  const [faceColors, setFaceColors] = useState(defaultFaceColors);
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
        <div className="col-span-1 space-y-4 py-2">
          <div className="text-xl font-semibold">Dice Slots</div>
          {[1, 2, 3, 4, 5, 6].map((_, idx) => (
            <div key={idx} className="space-y-1">
              <label className="text-sm text-muted-foreground">{`Slot ${
                idx + 1
              }`}</label>
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={faceTexts[idx]}
                  onChange={(e) => onChangeFace(idx, e.target.value)}
                  placeholder={`Text for slot ${idx + 1}`}
                />
                <input
                  // FINDET DEN RICHTIGEN TYP UM DEN INPUT ZU VERBESSERN
                  // https://www.w3schools.com/html/html_form_input_types.asp
                  type="color"
                  value={faceColors[idx]}
                  onChange={(e) => {
                    const next = [...faceColors];
                    next[idx] = e.target.value;
                    setFaceColors(next);
                  }}
                  className="h-8 w-10 rounded-md border p-0"
                />
              </div>
            </div>
          ))}
          <Button onClick={rollDice} className="w-full">
            Würfel Rollen
          </Button>
        </div>
        <div className="col-span-1 lg:col-span-2 rounded-md border bg-background h-full min-h-[420px]">
          <DiceScene
            ref={diceRef}
            texts={faceTexts}
            colors={faceColors}
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
