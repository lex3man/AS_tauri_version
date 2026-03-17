import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useTheme } from "@/ctx/theme-provider";

const Settings = () => {
  const { callView } = useAppState();
  const { theme, background, setTheme, setBackground } = useTheme();

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          SETTINGS
        </div>
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
      <div className="flex flex-col justify-center m-auto">
        <div className="flex flex-col justify-center m-auto md:w-1/2 sm:w-2/3 gap-2">
          <Button className="p-6 text-2xl" onClick={() => {}}>
            ROAD BOOK
          </Button>
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              if (background) {
                setBackground(false)
              } else {
                setBackground(true)
              }
              callView("navigate")
            }}
          >
            Background ON/OFF
          </Button>
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              if (theme === "light") {
                setTheme("dark");
              } else {
                setTheme("light");
              }
            }}
          >
            Dark Mode ON/OFF
          </Button>
          <Button className="p-6 text-2xl" onClick={() => {}}>
            GET REPORT
          </Button>
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              callView("request", "race number");
            }}
          >
            SET RACE NUMBER
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
