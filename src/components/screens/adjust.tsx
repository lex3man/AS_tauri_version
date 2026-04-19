import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

const convertToDigits = (src: number) => {
  let num = Number((src * 100).toFixed(0));
  const digits = [];
  while (num > 0) {
    digits.push(num % 10);
    num = Math.floor(num / 10);
  }
  while (digits.length < 6) {
    digits.push(0);
  }
  return digits.reverse();
};

const Adjust = () => {
  const [digits, setDigits] = useState<number[]>([]);
  const [totalUpdate, setTotalUpdate] = useState(0);
  const { callView, total, setTotal, roadbookMode } = useAppState();

  useEffect(() => {
    if (totalUpdate === 0) {
      setTotalUpdate(total);
    }
    setDigits(convertToDigits(totalUpdate));
  }, [totalUpdate, total]);

  return (
    <div>
      <div className="justify-center">
        <div className="flex justify-center m-auto w-1/3 text-center text-2xl font-extrabold p-10">
          TOTAL ADJUST
        </div>
        <div
          className={`absolute items-end ${roadbookMode ? "w-1/4" : "w-1/6"} right-5 top-5`}
        >
          <div className={`flex flex-col w-full`}>
            <Button
              className="p-7 text-2xl"
              onClick={() => {
                callView("navigate");
              }}
            >
              BACK
            </Button>
            <Button
              className="p-7 text-2xl"
              onClick={async () => {
                await invoke("update_total", { total: totalUpdate });
                setTotal(totalUpdate);
                callView("navigate");
              }}
            >
              APPLY
            </Button>
            <Button
              className="p-7 text-2xl"
              onClick={() => {
                setTotalUpdate(total);
              }}
            >
              RESET
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`flex h-full items-center justify-center ${roadbookMode && "pt-30"}`}
      >
        {digits.map((num, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex justify-center">
              <ArrowBigUpDash
                className={`${roadbookMode ? "size-10" : "size-15"}`}
                onClick={() => {
                  setTotalUpdate(
                    totalUpdate + 0.01 * 10 ** (digits.length - idx - 1),
                  );
                }}
              />
            </div>
            <div
              className={`text-center ${roadbookMode ? "text-[clamp(5rem,5vw,15rem)]" : "text-[clamp(10rem,5vw,22rem)]"} font-extrabold leading-none`}
            >
              {idx === digits.length - 2 && "."}
              {num}
            </div>
            <div className="flex justify-center">
              <ArrowBigDownDash
                className={`${roadbookMode ? "size-10" : "size-15"}`}
                onClick={() => {
                  if (num > 0) {
                    setTotalUpdate(
                      totalUpdate - 0.01 * 10 ** (digits.length - idx - 1),
                    );
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Adjust;
