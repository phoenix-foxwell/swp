import type { ActionArgs, LoaderArgs, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Fa6SolidMessage,
  Fa6SolidMobile,
  Fa6SolidUser,
  SolarPenBold,
} from "~/components/icons/icons";
import { userPrefs } from "~/cookies";
import { ApiCall } from "~/services/api";

export const loader: LoaderFunction = async (props: LoaderArgs) => {
  const cookieHeader = props.request.headers.get("Cookie");
  const cookie: any = await userPrefs.parse(cookieHeader);
  if (
    !(cookie == null || cookie == undefined || Object.keys(cookie).length == 0)
  ) {
    return redirect("/home");
  }
  return null;
};

const MobileLogin: React.FC = (): JSX.Element => {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isAlreadyLogin, setIsAlreadyLogin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const submit = async () => {
    setIsLoading((val) => true);
    if (mobile == null || mobile == undefined || mobile == "") {
      return toast.error("Enter the mobile number.", { theme: "light" });
    }

    const data = await ApiCall({
      query: `
                mutation mobileLogin($mobileLoginInput:MobileLoginInput!){
                    mobileLogin(mobileLoginInput:$mobileLoginInput){
                        id,
                        name,
                        contact
                    }
                }
            `,
      veriables: {
        mobileLoginInput: { contact: mobile },
      },
    });
    if (data.status) {
      setUser((val: any) => data.data.mobileLogin);
      setName((val) => data.data.mobileLogin.name);
      if (
        !(
          data.data.mobileLogin.name == null ||
          data.data.mobileLogin.name == undefined ||
          data.data.mobileLogin.name == ""
        )
      ) {
        setIsAlreadyLogin((val) => true);
      }
    } else {
      toast.error(data.message, { theme: "light" });
    }
    setIsLoading((val) => false);
  };

  const verifyOtp = async () => {
    setIsLoading((val) => true);
    if (mobile == null || mobile == undefined || mobile == "") {
      toast.error("Enter the mobile number.", { theme: "light" });
    } else if (name == undefined || name == null || name == "") {
      toast.error("Enter the user name.", { theme: "light" });
    } else if (otp == undefined || otp == null || otp == "") {
      toast.error("Enter the otp.", { theme: "light" });
    } else {
      const data = await ApiCall({
        query: `
                    query verifyOtp($mobileLoginInput:MobileLoginInput!){
                        verifyOtp(mobileLoginInput:$mobileLoginInput){
                            id,
                            name,
                            contact,
                            role,
                            token,
                            department
                        }
                    }
                `,
        veriables: {
          mobileLoginInput: { contact: mobile, name: name, otp: otp },
        },
      });

      if (!data.status) {
        toast.error(data.message, { theme: "light" });
      } else {
        iref!.current!.value = data.data.verifyOtp!.id;
        nref!.current!.value = data.data.verifyOtp!.name;
        cref!.current!.value = data.data.verifyOtp!.contact;
        rref!.current!.value = data.data.verifyOtp!.role;
        tref!.current!.value = data.data.verifyOtp!.token;
        nextButton.current!.click();
      }
    }
    setIsLoading((val) => false);
  };

  const iref = useRef<HTMLInputElement>(null);
  const cref = useRef<HTMLInputElement>(null);
  const nref = useRef<HTMLInputElement>(null);
  const rref = useRef<HTMLInputElement>(null);
  const tref = useRef<HTMLInputElement>(null);
  const dref = useRef<HTMLInputElement>(null);

  const nextButton = useRef<HTMLButtonElement>(null);

  const handleNumberChange = (value: string, fun: Function) => {
    fun((val: any) => value.replace(/\D/g, ""));
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed top-0 left-0 h-screen w-full">
        <img
          src="/images/daman.jpg"
          alt="login background"
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="min-h-screen w-full grid place-items-center relative">
        <div className="w-72 p-6 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-all bg-white border-t-4 border-purple-500">
          <div className="w-full grid place-items-center">
            <img
              src="/logo.png"
              alt="logo"
              className="w-60 h-60 object-cover object-center"
            />
          </div>
          <h1 className="text-gray-800 text-lg font-bold text-center my-4">
            Sign in to Account
          </h1>
          {user != null || user != undefined ? (
            !(
              user.name == null ||
              user.name == undefined ||
              user.name == ""
            ) ? (
              <h1 className="text-gray-800 text-2xl font-bold my-4 text-center">
                Welcome back {user.name}
              </h1>
            ) : null
          ) : null}
          <div className="border-b-2 border-gray-200 py-1 flex items-center">
            <div className="text-slate-800 font-bold text-lg mr-4">
              <Fa6SolidMobile></Fa6SolidMobile>
            </div>
            <input
              value={mobile}
              onChange={(e) => handleNumberChange(e.target.value, setMobile)}
              disabled={
                user == undefined || user == null || user == ""
                  ? false
                  : !(
                      user.contact == null ||
                      user.contact == undefined ||
                      user.contact == ""
                    )
              }
              type="text"
              placeholder="Mobile Number"
              className="bg-transparent outline-none border-none fill-none text-slate-800 py-2 w-full"
            />
            {user == undefined || user == null || user == "" ? null : (
              <div
                role="button"
                className="cursor-pointer"
                onClick={() => {
                  window.location.reload();
                }}
              >
                <SolarPenBold className="text-2xl text-gray-700"></SolarPenBold>
              </div>
            )}
          </div>
          {user != null || user != undefined ? (
            <>
              {user.name == null ||
              user.name == undefined ||
              user.name == "" ? (
                <div className="border-b-2 border-gray-200 py-1 flex items-center mt-4">
                  <div className="text-slate-800 font-bold text-lg mr-4">
                    <Fa6SolidUser></Fa6SolidUser>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName((val) => e.target.value)}
                    type="text"
                    placeholder="User Name"
                    className="bg-transparent outline-none border-none fill-none text-slate-800 py-2 w-full"
                  />
                </div>
              ) : null}
              <div className="border-b-2 border-gray-200 py-1 flex items-center mt-4">
                <div className="text-slate-800 font-bold text-lg mr-4">
                  <Fa6SolidMessage></Fa6SolidMessage>
                </div>
                <input
                  value={otp}
                  onChange={(e) => handleNumberChange(e.target.value, setOtp)}
                  type="text"
                  placeholder="OTP NUMBER"
                  className="bg-transparent outline-none border-none fill-none text-slate-800 py-2 w-full"
                />
              </div>
              {isLoading ? (
                <div className="inline-block text-center text-white bg-purple-500 py-1 px-6 text-lg font-medium rounded-md w-full mt-6">
                  Loading...
                </div>
              ) : (
                <button
                  onClick={verifyOtp}
                  className="inline-block text-center text-white bg-purple-500 py-1 px-6 text-lg font-medium rounded-md w-full mt-6"
                >
                  Submit
                </button>
              )}
            </>
          ) : isLoading ? (
            <div className="inline-block text-center text-white bg-purple-500 py-1 px-6 text-lg font-medium rounded-md w-full mt-6">
              Loading...
            </div>
          ) : (
            <button
              onClick={submit}
              className="inline-block text-center text-white bg-purple-500 py-1 px-6 text-lg font-medium rounded-md w-full mt-6"
            >
              Verify Mobile
            </button>
          )}
        </div>
      </div>
      <div className="hidden">
        <Form method="post">
          <input type="hidden" name="id" ref={iref} />
          <input type="hidden" name="token" ref={tref} />
          <input type="hidden" name="contact" ref={cref} />
          <input type="hidden" name="name" ref={nref} />
          <input type="hidden" name="role" ref={rref} />
          <input type="hidden" name="department" ref={dref} />
          <input
            type="hidden"
            name="isAlready"
            value={isAlreadyLogin ? "1" : "0"}
          />
          <button ref={nextButton} name="submit">
            Submit
          </button>
        </Form>
      </div>
    </div>
  );
};

export default MobileLogin;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const value = Object.fromEntries(formData);

  if (parseInt(value.isAlready.toString()) == 1) {
    return redirect("/home", {
      headers: {
        "Set-Cookie": await userPrefs.serialize(value),
      },
    });
  } else {
    return redirect("/adddata", {
      headers: {
        "Set-Cookie": await userPrefs.serialize(value),
      },
    });
  }
}
