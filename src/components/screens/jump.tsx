import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../ui/button";

const JumpSuggestion = () => {
  const { callView, jumpPointID } = useAppState();

  return (
    <div>
      <div className="flex justify-end">
        {/* <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          
        </div> */}
        <div className="flex pt-5 pr-5 justify-end w-1/3">
          <Button
            className="p-7 text-2xl"
            onClick={() => {
              callView("navigate");
            }}
          >
            BACK
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-center m-auto p-10 w-2/3">
        <div className="flex justify-center m-auto text-8xl font-extrabold p-20">JUMP TO</div>
        <div className="flex justify-between items-center">
          <div
            className="border-3 rounded-lg font-extrabold text-5xl bg-green-600 px-20 py-10"
            onClick={async () => {
              await invoke("jump_reaction", { flag: "yes" });
              callView("navigate");
            }}
          >
            YES
          </div>  
          <div className="m-auto text-8xl font-extrabold">{jumpPointID.split("-")[1]}</div>  
          <div 
            className="border-3 rounded-lg font-extrabold text-5xl bg-red-600 px-20 py-10"
            onClick={async () => {
              await invoke("jump_reaction", { flag: "no" });
              callView("navigate");
            }}
          >
            NO
          </div>  
        </div>
      </div>
    </div>
  );
};

export default JumpSuggestion;
