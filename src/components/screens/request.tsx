import { Button } from "@/components/ui/button";
import { server_init } from "@/lib/api";
import { TypeOfRequest } from "@/types/request";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  typeOfData: TypeOfRequest;
  setAnswer: (data: string) => void;
}

export const DataRequest = (props: Props) => {
  const [userInput, setUserInput] = useState("");

  return (
    <div className="flex flex-col justify-center m-auto gap-10 p-50">
      <div className="flex gap-5 m-auto">
        <input
          className="border-b-2 w-auto"
          value={userInput.toUpperCase()}
          onChange={(e) => setUserInput(e.target.value)}
          autoFocus
        ></input>
        <Button
          size={"lg"}
          onClick={() => {
            if (props.typeOfData === "race number") {
              server_init(userInput)
                .then(() => {})
                .catch((e) => {
                  toast.error(`Request faild with error: ${e}`, {
                    position: "bottom-center",
                    duration: 5000,
                  });
                });
            }
            props.setAnswer(userInput.toUpperCase());
          }}
        >
          SUBMIT
        </Button>
      </div>
      <div className="text-4xl m-auto">{props.typeOfData.toUpperCase()}</div>
    </div>
  );
};
