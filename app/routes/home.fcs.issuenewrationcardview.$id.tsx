import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Fa6SolidFileLines, Fa6SolidLink } from "~/components/icons/icons";
import { ApiCall, UploadFile } from "~/services/api";
import { toast } from "react-toastify";
import type { LoaderArgs, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { userPrefs } from "~/cookies";
import QueryTabs from "~/components/QueryTabs";
import { encrypt } from "~/utils";

export const loader: LoaderFunction = async (props: LoaderArgs) => {
  const id = props.params.id;
  const cookieHeader = props.request.headers.get("Cookie");
  const cookie: any = await userPrefs.parse(cookieHeader);
  const data = await ApiCall({
    query: `
        query getRationCardById($id:Int!){
            getRationCardById(id:$id){
              id
              userId
              mobile
              email
              card_type
              user_uid
              user_eid
              name
              mother_name
              father_name
              gender
              spouse_name
              date_of_birth
              age
              occupation
              annual_income
              gasconnection
              gas_company_name
              gas_agency_name
              consumer_no
              address
              village_id
              pin_code
              mandal
              district
              paddress
              pvillage_id
              ppin_code
              pmandal
              pdistrict
              old_ration_card_number
              informate_name
              informant_relation
              delivery_type
              mobile_no
              photo
              proof_one
              proof_one_name
              proof_two
              proof_two_name
              proof_three
              proof_three_name
              signature_url
              iagree
              remarks
              other_remarks
              status
              updatedAt
              deletedAt
              members{
                id
                userId
                name
                gender
                date_of_birth
                mother_name
                father_name
                spouse_name
                option_to_life_commodity
                age
                eid
                uid
                relationship_with_head_of_family
                status
                createdAt
                updatedAt
                deletedAt
              }
            }
          }
      `,
    veriables: {
      id: parseInt(id!),
    },
  });
  console.log(data);

  const submit = await ApiCall({
    query: `
        query searchCommon($searchCommonInput:SearchCommonInput!){
            searchCommon(searchCommonInput:$searchCommonInput){
              id,
              village,
              name,
              form_type,
              user_id,
              auth_user_id,
              focal_user_id,
              intra_user_id,
              inter_user_id,
              number,
              form_status,
              query_status, 
              event_date
            }
          }
      `,
    veriables: {
      searchCommonInput: {
        form_id: parseInt(id!),
        form_type: "NEWRATIONCARD",
      },
    },
  });

  const village = await ApiCall({
    query: `
        query getAllVillageById($id:Int!){
          getAllVillageById(id:$id){
              id,
              name
            }
          }
      `,
    veriables: {
      id: parseInt(data.data.getRationCardById.village_id),
    },
  });
  const pvillage = await ApiCall({
    query: `
        query getAllVillageById($id:Int!){
          getAllVillageById(id:$id){
              id,
              name
            }
          }
      `,
    veriables: {
      id: parseInt(data.data.getRationCardById.pvillage_id),
    },
  });

  return json({
    user: cookie,
    from_data: data.data.getRationCardById,
    submit: submit.status,
    village: village.data.getAllVillageById,
    pvillage: pvillage.data.getAllVillageById,
    common: submit.data.searchCommon,
  });
};

const NewRationCardConnectView: React.FC = (): JSX.Element => {
  const loader = useLoaderData();
  const user = loader.user;
  const villagedata = loader.village;
  const pvillagedata = loader.village;
  const from_data = loader.from_data;

  const isSubmited = loader.submit;

  const isUser = user.role == "USER";

  const common = isSubmited ? loader.common[0] : null;

  const navigator = useNavigate();

  const submit = async () => {
    const data = await ApiCall({
      query: `
            mutation createCommon($createCommonInput:CreateCommonInput!){
                createCommon(createCommonInput:$createCommonInput){
                  id,
                }
              }
            `,
      veriables: {
        createCommonInput: {
          form_id: Number(from_data.id),
          user_id: Number(user.id),
          auth_user_id: "66",
          focal_user_id: "65",
          intra_user_id: "65,66",
          inter_user_id: "0",
          village: villagedata.name,
          name: from_data.name,
          number: from_data.mobile.toString(),
          event_date: from_data.from_date,
          form_status: 1,
          form_type: "NEWRATIONCARD",
          query_status: "SUBMIT",
        },
      },
    });
    if (!data.status) {
      toast.error(data.message, { theme: "light" });
    } else {
      navigator("/home/");
    }
  };

  const handleLogoChange = (
    value: React.ChangeEvent<HTMLInputElement>,
    setvalue: Function
  ) => {
    let file_size = parseInt(
      (value!.target.files![0].size / 1024 / 1024).toString()
    );
    if (file_size < 4) {
      setvalue((val: any) => value!.target.files![0]);
    } else {
      toast.error("Image file size must be less then 4 mb", { theme: "light" });
    }
  };

  const [querybox, setQueryBox] = useState<boolean>(false);
  const queryRef = useRef<HTMLTextAreaElement>(null);
  const rejectRef = useRef<HTMLTextAreaElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<File>();

  const submitQuery = async () => {
    if (queryRef.current?.value == null || queryRef.current?.value == "")
      return toast.error("Remark is required", { theme: "light" });
    const req: { [key: string]: any } = {
      stage: "NEWRATIONCARD",
      form_id: from_data.id,
      from_user_id: Number(user.id),
      to_user_id: from_data.userId,
      form_status: common.form_status,
      query_type: "PUBLIC",
      remark: queryRef.current?.value,
      query_status: "SENT",
    };

    if (attachment != null) {
      const attach = await UploadFile(attachment);
      if (attach.status) {
        req.doc_url = attach.data;
      } else {
        return toast.error("Unable to upload attachment", { theme: "light" });
      }
    }

    const data = await ApiCall({
      query: `
            mutation createQuery($createQueryInput:CreateQueryInput!){
                createQuery(createQueryInput:$createQueryInput){
                  id,
                }
              }
            `,
      veriables: {
        createQueryInput: req,
      },
    });

    if (data.status) {
      setQueryBox((val) => false);
      return toast.success("Query sent successfully.", { theme: "light" });
    } else {
      return toast.error(data.message, { theme: "light" });
    }
  };

  const [forwardbox, setForwardBox] = useState<boolean>(false);
  const forwardRef = useRef<HTMLTextAreaElement>(null);

  interface forwardqueryType {
    title: string;
    formstatus: number;
    querytype: string;
    authuserid: string;
    foacaluserid: string;
    intrauserid: string;
    interuserid: string;
    touserid: number;
    querystatus: string;
  }

  const [nextdata, setNextData] = useState<forwardqueryType>({
    title: "Send to SUPTD",
    authuserid: "0",
    foacaluserid: "0",
    intrauserid: "0",
    interuserid: "0",
    formstatus: 0,
    querytype: "NONE",
    touserid: 0,
    querystatus: "NONE",
  });

  const forwardQuery = async (args: forwardqueryType) => {
    if (forwardRef.current?.value == null || forwardRef.current?.value == "")
      return toast.error("Remark is required", { theme: "light" });
    const req: { [key: string]: any } = {
      stage: "NEWRATIONCARD",
      form_id: from_data.id,
      from_user_id: Number(user.id),
      to_user_id: args.touserid,
      form_status: args.formstatus,
      query_type: args.querytype,
      remark: forwardRef.current?.value,
      query_status: "SENT",
    };

    if (attachment != null) {
      const attach = await UploadFile(attachment);
      if (attach.status) {
        req.doc_url = attach.data;
      } else {
        return toast.error("Unable to upload attachment", { theme: "light" });
      }
    }

    const data = await ApiCall({
      query: `
            mutation createQuery($createQueryInput:CreateQueryInput!){
                createQuery(createQueryInput:$createQueryInput){
                  id,
                }
              }
            `,
      veriables: {
        createQueryInput: req,
      },
    });

    if (data.status) {
      const data = await ApiCall({
        query: `
                mutation updateCommonById($updateCommonInput:UpdateCommonInput!){
                    updateCommonById(updateCommonInput:$updateCommonInput){
                      id,
                    }
                  }
              `,
        veriables: {
          updateCommonInput: {
            id: common.id,
            auth_user_id: args.authuserid,
            focal_user_id: args.foacaluserid,
            intra_user_id: args.intrauserid,
            inter_user_id: args.interuserid,
            form_status: args.formstatus,
            query_status: args.querystatus,
          },
        },
      });

      if (!data.status) {
        toast.error(data.message, { theme: "light" });
      } else {
        setForwardBox((val) => false);
        toast.success("Form sent successfully.", { theme: "light" });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } else {
      return toast.error(data.message, { theme: "light" });
    }
  };

  const [notings, setNotings] = useState<any[]>([]);

  const getNotings = async () => {
    const data = await ApiCall({
      query: `
                query searchQuery($searchQueryInput:SearchQueryInput!){
                    searchQuery(searchQueryInput:$searchQueryInput){
                        id,
                        from_user_id,
                        to_user_id
                        remark
                        doc_url,
                        createdAt,
                        query_type,
                        from_user{
                            name,
                            role
                        },
                        to_user{
                            name,
                            role
                        }
                    }
                  }
                `,
      veriables: {
        searchQueryInput: {
          form_id: from_data.id,
          stage: "NEWRATIONCARD",
          query_type: isUser ? "PUBLIC" : "INTRA",
        },
      },
    });
    if (data.status) {
      setNotings((val) => data.data.searchQuery);
    }
  };
  useEffect(() => {
    getNotings();
  }, []);

  const [rejectbox, setRejectBox] = useState<boolean>(false);
  const [rejectid, setRejectid] = useState<number>(0);

  const reject = async (id: number) => {
    if (rejectRef.current?.value == null || rejectRef.current?.value == "")
      return toast.error("Reject reason is required", { theme: "light" });
    if (rejectid == 0)
      return toast.error("Select the form for rejection.", { theme: "light" });
    const data = await ApiCall({
      query: `
            mutation updateCommonById($updateCommonInput:UpdateCommonInput!){
                updateCommonById(updateCommonInput:$updateCommonInput){
                  id,
                }
              }
          `,
      veriables: {
        updateCommonInput: {
          id: id,
          query_status: "REJECTED",
        },
      },
    });

    if (!data.status) {
      toast.error(data.message, { theme: "light" });
    } else {
      const req: { [key: string]: any } = {
        stage: "NEWRATIONCARDs",
        form_id: from_data.id,
        from_user_id: Number(user.id),
        to_user_id: from_data.userId,
        form_status: common.form_status,
        query_type: "PUBLIC",
        remark: rejectRef.current?.value,
        query_status: "SENT",
      };

      const data = await ApiCall({
        query: `
                mutation createQuery($createQueryInput:CreateQueryInput!){
                    createQuery(createQueryInput:$createQueryInput){
                      id,
                    }
                  }
                `,
        veriables: {
          createQueryInput: req,
        },
      });

      if (data.status) {
        setQueryBox((val) => false);
        toast.success("Form Rejected successfully.", { theme: "light" });
      } else {
        toast.error(data.message, { theme: "light" });
      }
    }

    setRejectBox(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const [paymentbox, setPaymentBox] = useState<boolean>(false);

  const [payamt, setPayamt] = useState<{ [key: string]: number }>({
    type1: 0,
    amount1: 0,
    type2: 0,
    amount2: 0,
    type3: 0,
    amount3: 0,
  });

  const requestpayment = async () => {
    let req: any = {
      form_id: from_data.id,
      deptuser_id: parseInt(user.id),
      user_id: parseInt(from_data.userId),
      form_type: "NEWRATIONCARD",
      paymentstatus: "PENDING",
      daycount: 0,
    };
    if (payamt.type1 != 0) req.type1 = payamt.type1;
    if (payamt.amount1 != 0) req.amount1 = payamt.amount1;
    if (payamt.type2 != 0) req.type2 = payamt.type2;
    if (payamt.amount2 != 0) req.amount2 = payamt.amount2;
    if (payamt.type3 != 0) req.type3 = payamt.type3;
    if (payamt.amount3 != 0) req.amount3 = payamt.amount3;
    // if (parseInt(timelimit!.current!.value) != 0)
    // req.daycount = parseInt(timelimit!.current!.value);
    if (
      payamt.type1 * payamt.amount1 +
        payamt.type2 * payamt.amount2 +
        payamt.type3 * payamt.amount3 !=
      0
    )
      req.paymentamout =
        payamt.type1 * payamt.amount1 +
        payamt.type2 * payamt.amount2 +
        payamt.type3 * payamt.amount3;

    const addpayment = await ApiCall({
      query: `
                mutation createPayment($createPaymentInput:CreatePaymentInput!){
                    createPayment(createPaymentInput:$createPaymentInput){
                      id,
                    }
                  }
              `,
      veriables: {
        createPaymentInput: req,
      },
    });

    if (!addpayment.status) {
      setPaymentBox(false);
      toast.error(addpayment.message, { theme: "light" });
    } else {
      const reqdata: { [key: string]: any } = {
        stage: "NEWRATIONCARD",
        form_id: from_data.id,
        from_user_id: 51,
        to_user_id: Number(from_data.userId),
        form_status: common.form_status,
        query_type: "PUBLIC",
        remark: `Payment Request of Rs. (${req.paymentamout}) requested successfully from user.`,
        query_status: "SENT",
        status: "NONE",
      };

      const data = await ApiCall({
        query: `
                    mutation createQuery($createQueryInput:CreateQueryInput!){
                        createQuery(createQueryInput:$createQueryInput){
                          id,
                        }
                      }
                    `,
        veriables: {
          createQueryInput: reqdata,
        },
      });

      if (data.status) {
        setPaymentBox(false);
        toast.success("Payment request sent to user", { theme: "light" });

        let payreq: any = {
          id: from_data.id,
        };

        if (attachment != null) {
          const attach = await UploadFile(attachment);
          if (attach.status) {
            payreq.payment_doc = attach.data;
          } else {
            return toast.error("Unable to upload attachment", {
              theme: "light",
            });
          }
        }

        const savepaymentdoc = await ApiCall({
          query: `
                        mutation updateRationCardById($updateNewrationcardInput:UpdateNewrationcardInput!){
                            updateRationCardById(updateNewrationcardInput:$updateNewrationcardInput){
                              id,
                            }
                          }
                        `,
          veriables: {
            updateNewrationcardInput: payreq,
          },
        });

        if (!savepaymentdoc.status) {
          toast.error(savepaymentdoc.message, { theme: "light" });
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        return toast.error(data.message, { theme: "light" });
      }
    }
  };

  const handleInputChange = (key: string, value: number) => {
    setPayamt((prevPayamt) => ({
      ...prevPayamt,
      [key]: value,
    }));
  };

  const submitpayment = async () => {
    const uniqueid = (): string => {
      const length = 10;
      const charSet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let randomString = "";
      for (let i = 0; i < length; i++) {
        const randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
      }

      return randomString;
    };

    window.location.href = `/payamount?xlmnx=${
      loader.paymentinfo.paymentamout
    }&ynboy=${uniqueid()}&zgvfz=${parseInt(
      loader.paymentinfo.id.toString()
    )}_${parseInt(loader.paymentinfo.user_id.toString())}_${from_data.id}_${
      loader.paymentinfo.form_type
    }_${common.form_status}`;
  };

  return (
    <>
      {/* payment box start here */}
      <div
        className={`fixed top-0 left-0 bg-black bg-opacity-20 min-h-screen w-full  z-50 ${
          paymentbox ? "grid place-items-center" : "hidden"
        }`}
      >
        <div className="bg-white p-4 rounded-md w-96">
          <h3 className="text-2xl text-center font-semibold">
            Payment Request
          </h3>
          <div className="w-full h-[2px] bg-gray-800 my-4"></div>
          <div className="flex gap-3 my-2 justify-between">
            <p className="flex-1"></p>
            {/* <p className="flex-1">Page Qty.</p> */}
            <p className="flex-1">Amount</p>
            {/* <p className="flex-1">Total</p> */}
          </div>
          <div className="flex gap-3 my-2 justify-between">
            <p className="shrink-0 flex-1">A4</p>
            {/* <input
              value={payamt.type1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("type1", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none arounded-md py-1 px-2"
            /> */}
            <input
              value={payamt.amount1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("amount1", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            />
            {/* <p className="flex-1 shrink-0">{payamt.type1 * payamt.amount1}</p> */}
          </div>
          <div className="flex gap-3 my-2 justify-between">
            <p className="shrink-0 flex-1">A3</p>
            {/* <input
              value={payamt.type2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("type2", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            /> */}
            <input
              value={payamt.amount2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("amount2", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            />
            {/* <p className="flex-1 shrink-0">{payamt.type2 * payamt.amount2}</p> */}
          </div>
          <div className="flex gap-3 my-2 justify-between">
            <p className="shrink-0 flex-1">Maps</p>
            {/* <input
              value={payamt.type3}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("type3", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            /> */}
            <input
              value={payamt.amount3}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const newValue = parseInt(e.target.value) || 0;
                handleInputChange("amount3", newValue);
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            />
            {/* <p className="flex-1 shrink-0">{payamt.type3 * payamt.amount3}</p> */}
          </div>
          <div className="w-full h-[1px] bg-gray-800 my-2"></div>
          <div className="flex gap-3 my-2 justify-between">
            <p className="shrink-0 flex-1">Total</p>
            {/* <p className="shrink-0 flex-1">
              {payamt.type1 + payamt.type2 + payamt.type3}
            </p> */}
            <p className="shrink-0 flex-1">
              {payamt.amount1 + payamt.amount2 + payamt.amount3}
            </p>
            {/* <p className="shrink-0 flex-1">
              {payamt.type1 * payamt.amount1 +
                payamt.type2 * payamt.amount2 +
                payamt.type3 * payamt.amount3}
            </p> */}
          </div>

          <div className="w-full h-[1px] bg-gray-800 my-2"></div>
          {/* <div className="flex gap-3 my-2 justify-between">
            <p className="flex-2">Time Limit [Day]</p>
            <div className="flex-1"></div>
            <input
              ref={timelimit}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }}
              type="text"
              className="flex-1 w-20 bg-[#eeeeee] fill-none focus:outline-none outline-none rounded-md py-1 px-2"
            />
          </div> */}
          <div className="flex flex-wrap gap-6 mt-4">
            <button
              onClick={requestpayment}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium grow"
            >
              Request
            </button>
            <button
              onClick={() => setPaymentBox((val) => false)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium grow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* payment box end here */}
      {/* reject box start here */}
      <div
        className={`fixed top-0 left-0 bg-black bg-opacity-20 min-h-screen w-full  z-50 ${
          rejectbox ? "grid place-items-center" : "hidden"
        }`}
      >
        <div className="bg-white p-4 rounded-md w-80">
          <h3 className="text-2xl text-center font-semibold">
            Are you sure you want to reject?
          </h3>
          <textarea
            ref={rejectRef}
            placeholder="Reject Reason"
            className=" w-full border-2 border-gray-600 bg-transparent outline-none fill-none text-slate-800 p-2 h-28 resize-none my-2"
          ></textarea>
          <div className="flex flex-wrap gap-6 mt-4">
            <button
              onClick={() => reject(rejectid)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium grow"
            >
              Reject
            </button>
            <button
              onClick={() => setRejectBox((val) => false)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-blue-500 text-center rounded-md font-medium grow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* reject box end here */}
      {/* query box start here */}
      <div
        className={`fixed top-0 left-0 bg-black bg-opacity-20 min-h-screen w-full  z-50 ${
          querybox ? "grid place-items-center" : "hidden"
        }`}
      >
        <div className="bg-white p-4 rounded-md w-80">
          <h3 className="text-2xl text-center font-semibold">Raise query</h3>

          <textarea
            ref={queryRef}
            placeholder="Information Needed"
            className=" w-full border-2 border-gray-600 bg-transparent outline-none fill-none text-slate-800 p-2 h-28 resize-none my-4"
          ></textarea>

          <div className="flex-none flex flex-col gap-4 lg:flex-1 w-full lg:w-auto">
            <div className="hidden">
              <input
                type="file"
                ref={attachmentRef}
                accept="*/*"
                onChange={(e) => handleLogoChange(e, setAttachment)}
              />
            </div>
            <button
              onClick={() => attachmentRef.current?.click()}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-[#0984e3] text-center rounded-md font-medium"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink>{" "}
                {attachment == null ? "Attach Doc." : "Update Doc."}
              </div>
            </button>
            {attachment != null ? (
              <a
                target="_blank"
                href={URL.createObjectURL(attachment)}
                className="py-1 w-full sm:w-auto flex items-center gap-2  text-white text-lg px-4 bg-yellow-500 text-center rounded-md font-medium"
                rel="noreferrer"
              >
                <Fa6SolidFileLines></Fa6SolidFileLines>
                <p>View Doc.</p>
              </a>
            ) : null}
          </div>
          <div className="w-full h-[2px] bg-gray-800 my-4"></div>
          <div className="flex flex-wrap gap-6 mt-4">
            <button
              onClick={submitQuery}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium grow"
            >
              Proceed
            </button>
            <button
              onClick={() => setQueryBox((val) => false)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium grow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* query box end here */}
      {/* forward box start here */}
      <div
        className={`fixed top-0 left-0 bg-black bg-opacity-20 min-h-screen w-full  z-50 ${
          forwardbox ? "grid place-items-center" : "hidden"
        }`}
      >
        <div className="bg-white p-4 rounded-md w-80">
          <h3 className="text-2xl text-center font-semibold">
            {nextdata.title}
          </h3>
          <textarea
            ref={forwardRef}
            placeholder="Information Needed"
            className=" w-full border-2 border-gray-600 bg-transparent outline-none fill-none text-slate-800 p-2 h-28 resize-none my-4"
          ></textarea>
          <div className="flex-none flex flex-col gap-4 lg:flex-1 w-full lg:w-auto">
            <div className="hidden">
              <input
                type="file"
                ref={attachmentRef}
                accept="*/*"
                onChange={(e) => handleLogoChange(e, setAttachment)}
              />
            </div>
            <button
              onClick={() => attachmentRef.current?.click()}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-[#0984e3] text-center rounded-md font-medium"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink>{" "}
                {attachment == null ? "Attach Doc." : "Update Doc."}
              </div>
            </button>
            {attachment != null ? (
              <a
                target="_blank"
                href={URL.createObjectURL(attachment)}
                className="py-1 w-full sm:w-auto flex items-center gap-2  text-white text-lg px-4 bg-yellow-500 text-center rounded-md font-medium"
                rel="noreferrer"
              >
                <Fa6SolidFileLines></Fa6SolidFileLines>
                <p>View Doc.</p>
              </a>
            ) : null}
          </div>
          <div className="w-full h-[2px] bg-gray-800 my-4"></div>
          <div className="flex flex-wrap gap-6 mt-4">
            <button
              onClick={() => forwardQuery(nextdata)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium grow"
            >
              Proceed
            </button>
            <button
              onClick={() => setForwardBox((val) => false)}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium grow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* forward box end here */}
      <div className="bg-white rounded-md shadow-lg p-4 my-4 w-full">
        <h1 className="text-gray-800 text-2xl font-semibold text-center">
          New Ration Card Connection Permission
        </h1>
        <div className="w-full flex gap-4 my-4">
          <div className="grow bg-gray-700 h-[2px]"></div>
          <div className="w-10 bg-gray-500 h-[3px]"></div>
          <div className="grow bg-gray-700 h-[2px]"></div>
        </div>
        <p className="text-center font-semibold text-xl text-gray-800">
          SUBJECT : Request for Obtaining New Ration Card Connection Permission.
        </p>

        {/*--------------------- section 1 start here ------------------------- */}
        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            1. Village Details{" "}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">1.1</span> Applicant village
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {villagedata.name}
          </div>
        </div>
        {/*--------------------- section 1 end here ------------------------- */}

        {/*--------------------- section 2 start here ------------------------- */}
        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            2. Applicant Details(s)
          </p>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.1</span> Card Type
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.card_type}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.2</span> Applicant Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.name}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.3</span> Applicant Father Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.father_name}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.4</span> Applicant Mother Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.mother_name}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.5</span> Applicant Spouse Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.spouse_name}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.6</span> Gender
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.gender}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.7</span> Date of Birth
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {new Date(from_data.date_of_birth)
              .toJSON()
              .slice(0, 10)
              .split("-")
              .reverse()
              .join("/")}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.8</span> Applicant Contact Number
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.mobile}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.9</span> Applicant Email
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.email}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.10</span> Applicant UID
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            XXXX-XXXX-{from_data.user_uid}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.11</span> Applicant EID
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.user_eid}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.12</span> Applicant Age
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.age}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">2.13</span> Old Ration Card No. (If any)
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.old_ration_card_number}
          </div>
        </div>
        {/*--------------------- section 2 end here ------------------------- */}

        {/*--------------------- section 3 start here ------------------------- */}

        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            3. Professional Details(s)
          </p>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">3.1</span> Occupation
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.occupation}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">3.2</span> Annual Income
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.annual_income}
          </div>
        </div>

        {/*--------------------- section 3 end here ------------------------- */}

        {/*--------------------- section 4 start here ------------------------- */}

        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            4. Gas Connection Details
          </p>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">4.1</span> Gas Connection Status
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.gasconnection}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">4.2</span> Gas Company Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.gas_company_name}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">4.3</span> Gas Agency Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.gas_agency_name}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">4.4</span> Consumer No
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.consumer_no}
          </div>
        </div>

        {/*--------------------- section 4 end here ------------------------- */}

        {/*--------------------- section 5 start here ------------------------- */}
        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            5. Residence Address
          </p>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">5.1</span> Address
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.address}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">5.2</span> District
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.district}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">5.3</span> Mandal
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.mandal}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">5.4</span> Pin Code
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.pin_code}
          </div>
        </div>

        {/*--------------------- section 5 end here ------------------------- */}

        {/*--------------------- section 6 start here ------------------------- */}

        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            6. Permanent Address
          </p>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">6.1</span> Applicant village
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {pvillagedata.name}
          </div>
        </div>
        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">6.2</span> Address
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.paddress}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">6.3</span> District
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.pdistrict}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">6.4</span> Mandal
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.pmandal}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">6.5</span> Pin Code
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.ppin_code}
          </div>
        </div>

        {/*--------------------- section 6 end here ------------------------- */}

        {/*--------------------- section 7 start here ------------------------- */}
        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            7. Informant Details
          </p>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">7.1</span> Informant Name
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.informate_name}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">7.2</span> Informant Relation
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.informant_relation}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">7.3</span> Delivery Type
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.delivery_type}
          </div>
        </div>

        <div className="flex  flex-wrap gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700 ">
            <span className="mr-2">7.4</span> Mobile No
          </div>
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal">
            {from_data.mobile_no}
          </div>
        </div>

        {/*--------------------- section 7 end here ------------------------- */}

        {/*--------------------- section 8 start here ------------------------- */}

        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            8. Document Attachment(s)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">8.1</span> Applicant UIDAI Aadhaar Upload
            <p className="text-rose-500 text-sm">
              ( Maximum Upload Size 2MB & Allowed Format JPG / PDF / PNG )
            </p>
          </div>
          <div className="flex-none flex gap-4 lg:flex-1 w-full lg:w-auto">
            <a
              target="_blank"
              href={from_data.proof_three_name}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink> View Doc.
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">8.2</span> Gas Connection Proof
            <p className="text-rose-500 text-sm">
              ( Maximum Upload Size 2MB & Allowed Format JPG / PDF / PNG )
            </p>
          </div>
          <div className="flex-none flex gap-4 lg:flex-1 w-full lg:w-auto">
            <a
              target="_blank"
              href={from_data.proof_one}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink> View Doc.
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">8.3</span> Residence Proof
            <p className="text-rose-500 text-sm">
              ( Maximum Upload Size 2MB & Allowed Format JPG / PDF / PNG )
            </p>
          </div>
          <div className="flex-none flex gap-4 lg:flex-1 w-full lg:w-auto">
            <a
              target="_blank"
              href={from_data.proof_two}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink> View Doc.
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">8.4</span> Applicant Photo
            <p className="text-rose-500 text-sm">
              ( Maximum Upload Size 2MB & Allowed Format JPG / PDF / PNG )
            </p>
          </div>
          <div className="flex-none flex gap-4 lg:flex-1 w-full lg:w-auto">
            <a
              target="_blank"
              href={from_data.photo}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink> View Doc.
              </div>
            </a>
          </div>
        </div>

        {/*--------------------- section 8 end here ------------------------- */}

        {/*--------------------- section 9 start here ------------------------- */}
        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            9. Applicant / Occupant Declaration and Signature{" "}
          </p>
        </div>

        <div className="flex gap-4 gap-y-2 px-4 py-2 my-2">
          <div className="text-xl font-normal text-left text-gray-700 ">
            9.1
          </div>
          <div className="flex items-start">
            <p className="text-xl font-normal text-left text-gray-700 pr-2">
              {from_data.iagree}
            </p>
            <label
              htmlFor="checkbox"
              className="text-xl font-normal text-left text-gray-700 "
            >
              I solemnly affirm & hereby give undertaking that the above
              information furnished by me are correct and true to the best of my
              knowledge and belief
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 gap-y-2 items-center px-4 py-2 my-2">
          <div className="flex-none lg:flex-1 w-full lg:w-auto text-xl font-normal text-left text-gray-700">
            <span className="mr-2">9.2</span> Applicant Signature Image
            <p className="text-rose-500 text-sm">
              ( Maximum Upload Size 2MB & Allowed Format JPG / PDF / PNG )
            </p>
          </div>
          <div className="flex-none flex gap-4 lg:flex-1 w-full lg:w-auto">
            <a
              target="_blank"
              href={from_data.signature_url}
              className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <Fa6SolidLink></Fa6SolidLink> View Doc.
              </div>
            </a>
          </div>
        </div>
        {/*--------------------- section 9 end here ------------------------- */}

        <div className="w-full bg-[#0984e3] py-2 rounded-md px-4 mt-4">
          <p className="text-left font-semibold text-xl text-white">
            Member List
          </p>
        </div>

        <div className="container mx-auto my-5">
          {from_data.members.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-left">
                  <th className="py-2 px-4 border">Name</th>
                  <th className="py-2 px-4 border">Gender</th>
                  <th className="py-2 px-4 border">Date of Birth</th>
                  <th className="py-2 px-4 border">Mother's Name</th>
                  <th className="py-2 px-4 border">Father's Name</th>
                  <th className="py-2 px-4 border">Spouse Name</th>
                  <th className="py-2 px-4 border">UID</th>
                  <th className="py-2 px-4 border">EID</th>
                  <th className="py-2 px-4 border">Age</th>
                  <th className="py-2 px-4 border">Option to Life Commodity</th>
                  <th className="py-2 px-4 border">Relationship with Head</th>
                </tr>
              </thead>
              <tbody>
                {from_data.members.map((m: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border">{m.name}</td>
                    <td className="py-2 px-4 border">{m.gender}</td>
                    <td className="py-2 px-4 border">{m.date_of_birth}</td>
                    <td className="py-2 px-4 border">{m.mother_name}</td>
                    <td className="py-2 px-4 border">{m.father_name}</td>
                    <td className="py-2 px-4 border">
                      {m.spouse_name || "N/A"}
                    </td>
                    <td className="py-2 px-4 border">{m.uid}</td>
                    <td className="py-2 px-4 border">{m.eid}</td>
                    <td className="py-2 px-4 border">{m.age}</td>
                    <td className="py-2 px-4 border">
                      {m.option_to_life_commodity ? "Yes" : "No"}
                    </td>
                    <td className="py-2 px-4 border">
                      {m.relationship_with_head_of_family}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No members available</p>
          )}
        </div>
        {isSubmited ? (
          user.id == from_data.userId ? (
            common.form_status == 75 ? (
              <Link
                target="_blank"
                to={`/newwaterconnectpdf/${encrypt(
                  `NWC-${("0000" + from_data.id).slice(-4)}-${
                    from_data.createdAt.toString().split("-")[0]
                  }`,
                  "certificatedata"
                )}`}
                className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-[#0984e3] text-center rounded-md font-medium"
              >
                Download New Ration Card Connect Certificate
              </Link>
            ) : null
          ) : (
            <>
              <div className="flex flex-wrap gap-6 mt-4">
                <Link
                  to={"/home/"}
                  className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium"
                >
                  Close
                </Link>

                {common.query_status == "REJECTED" ? null : (
                  <>
                    {user.id == common.auth_user_id ? (
                      <button
                        onClick={() => setQueryBox((val) => true)}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
                      >
                        Query
                      </button>
                    ) : null}
                    {user.id == common.auth_user_id ? (
                      <button
                        onClick={() => {
                          setRejectid((val) => common.id);
                          setRejectBox(true);
                        }}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium"
                      >
                        Reject
                      </button>
                    ) : null}

                    {common.form_status == 1 && user.id == 66 ? (
                      <button
                        onClick={() => {
                          setForwardBox((val) => true);
                          setNextData((val) => ({
                            title: "Forward to Headclerk",
                            formstatus: 25,
                            querytype: "INTRA",
                            authuserid: "67",
                            foacaluserid: "65",
                            intrauserid: "65,67",
                            interuserid: "0",
                            touserid: 67,
                            querystatus: "INPROCESS",
                          }));
                        }}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-cyan-500 text-center rounded-md font-medium"
                      >
                        Forward to Headclerk
                      </button>
                    ) : null}
                    {/* LDC button */}
                    {common.form_status == 25 && user.id == 67 ? (
                      <button
                        onClick={() => {
                          setForwardBox((val) => true);
                          setNextData((val) => ({
                            title: "Forward to SUPTD",
                            formstatus: 50,
                            querytype: "INTRA",
                            authuserid: "65",
                            foacaluserid: "65",
                            intrauserid: "65,67",
                            interuserid: "0",
                            touserid: 65,
                            querystatus: "INPROCESS",
                          }));
                        }}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-cyan-500 text-center rounded-md font-medium"
                      >
                        Forward to SUPTD
                      </button>
                    ) : null}

                    {/* Suptd button */}
                    {common.form_status == 50 && user.id == 65 ? (
                      <button
                        onClick={() => {
                          setForwardBox((val) => true);
                          setNextData((val) => ({
                            title: "Convey to Applicant",
                            formstatus: 75,
                            querytype: "PUBLIC",
                            authuserid: "0",
                            foacaluserid: "65",
                            intrauserid: "0",
                            interuserid: "0",
                            touserid: from_data.userId,
                            querystatus: "APPROVED",
                          }));
                        }}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-cyan-500 text-center rounded-md font-medium"
                      >
                        Convey to Applicant
                      </button>
                    ) : null}

                    {common.form_status == 75 && user.id == 65 ? (
                      <Link
                        to={`/newwaterconnectpdf/${from_data.id}`}
                        className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-cyan-500 text-center rounded-md font-medium"
                      >
                        Download Certificate
                      </Link>
                    ) : null}
                  </>
                )}
              </div>
            </>
          )
        ) : user.id == from_data.userId ? (
          <>
            <div className="flex flex-wrap gap-6 mt-4">
              <Link
                to={"/home/"}
                className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-rose-500 text-center rounded-md font-medium"
              >
                Discard & Close
              </Link>
              <button
                onClick={submit}
                className="py-1 w-full sm:w-auto text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium"
              >
                Proceed
              </button>
            </div>
          </>
        ) : null}
      </div>
      {user.id == from_data.userId &&
      loader.payment &&
      loader.paymentinfo.paymentstatus == "PENDING" ? (
        <div className="p-6 bg-white rounded-lg shadow-lg my-8 grid place-items-center">
          <div className="bg-white p-4 rounded-md w-96">
            <h3 className="text-2xl text-center font-semibold">
              Payment Request
            </h3>
            <div className="w-full h-[2px] bg-gray-800 my-4"></div>
            <div className="flex gap-3 my-2 justify-between">
              <p className="flex-1"></p>
              <p className="flex-1 text-center">Amount</p>
            </div>
            <div className="flex gap-3 my-2 justify-between">
              <p className="shrink-0 flex-1">A4</p>

              <p className="shrink-0 flex-1 text-center">
                {loader.paymentinfo.amount1 ?? 0}
              </p>
            </div>
            <div className="flex gap-3 my-2 justify-between">
              <p className="shrink-0 flex-1">A3</p>

              <p className="shrink-0 flex-1 text-center">
                {loader.paymentinfo.amount2 ?? 0}
              </p>
            </div>
            <div className="flex gap-3 my-2 justify-between">
              <p className="shrink-0 flex-1">Maps</p>

              <p className="shrink-0 flex-1 text-center">
                {loader.paymentinfo.amount3 ?? 0}
              </p>
            </div>
            <div className="w-full h-[1px] bg-gray-800 my-2"></div>
            <div className="flex gap-3 my-2 justify-between">
              <p className="shrink-0 flex-1">Total</p>

              <p className="shrink-0 flex-1 text-center">
                {loader.paymentinfo.amount1 ??
                  0 + loader.paymentinfo.amount2 ??
                  0 + loader.paymentinfo.amount3 ??
                  0}
              </p>
            </div>

            <div className="w-full h-[1px] bg-gray-800 my-2"></div>

            <div className="w-full">
              <button
                onClick={submitpayment}
                className="py-1 w-full text-white text-lg px-4 bg-green-500 text-center rounded-md font-medium grow"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="p-6 bg-white rounded-lg shadow-lg my-8">
        <h1 className="text-gray-800 text-2xl font-semibold text-center">
          Notings
        </h1>
        <div className="w-full flex gap-4 my-4">
          <div className="grow bg-gray-700 h-[2px]"></div>
          <div className="w-10 bg-gray-500 h-[3px]"></div>
          <div className="grow bg-gray-700 h-[2px]"></div>
        </div>
        {notings.length == 0 ? (
          <h3 className="text-2xl font-semibold text-center bg-rose-500 bg-opacity-25 rounded-md border-l-4 border-rose-500 py-2  text-rose-500">
            You have not submitted any query.
          </h3>
        ) : (
          <>
            {notings.map((val: any, index: number) => {
              return (
                <div key={index}>
                  <QueryTabs
                    isUser={val.from_user_id == user.id}
                    message={val.remark}
                    date={val.createdAt}
                    doc={val.doc_url}
                    from_user={
                      val.from_user.role == "USER" ? "User" : val.from_user.name
                    }
                    to_user={
                      val.to_user.role == "USER" ? "User" : val.to_user.name
                    }
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};

export default NewRationCardConnectView;