import { SlotResponse, AllSlotsResponse } from "./types.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

await load({ export: true });

interface WebSocketQueryOptions {
  wsAddress: string;
  message: string;
  expectedResponseID: number;
  timeout?: number;
}

function webSocketQuery<T>({
  wsAddress, 
  message, 
  expectedResponseID,
  timeout = 2000,
}: WebSocketQueryOptions ): Promise<T>{
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      reject(new Error(`Websocket connection to ${wsAddress} timed out after ${timeout}ms.`))
    }, timeout)
    const socket = new WebSocket(wsAddress);
    socket.onopen = () => {
      socket.send(message);
    }
    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.id === expectedResponseID) {
        resolve(data)
      } 
      socket.close();
    };
  })
}

interface queryCobaltCardOptions {
  frameWSAddress: string,
  cardNumber: number,
}

const queryCobaltCard = async ({
  frameWSAddress,
  cardNumber,
}: queryCobaltCardOptions) => {
  try {
    const menuGroupsResponse = await webSocketQuery({
      wsAddress: `http://${frameWSAddress}/rosetta_api/slots/${cardNumber}`,
      message: `{"menugroups":"all","method":"get","id":0}`,
      expectedResponseID: 0,
    })

    console.log(menuGroupsResponse.menugroups[0].menus[0].subMenus[0].name) // ooga booga

    const cobaltCardResponse: SlotResponse = await webSocketQuery({
      wsAddress: `http://${frameWSAddress}/rosetta_api/slots/${cardNumber}`,
      message: `{"oids":"all","menuId":0,"method":"get","id":1}`,
      expectedResponseID: 1,
    })
  } catch (error) {
    console.error(`Error while querying card ${cardNumber} in the frame at ${frameWSAddress}.`)
    console.error(error.message)
  }
}

const queryCobaltFrame = async (frameWSAddress: string) => {
  try {
    const allSlotsResponse: AllSlotsResponse = await webSocketQuery({
      wsAddress: `http://${frameWSAddress}/rosetta_api/slots`,
      message: `{"slots":"all","method":"get","id":0}`,
      expectedResponseID: 0,
    })
    const cardResponsePromises = allSlotsResponse.slots
      .filter((slot) => slot.status === 'card')
      .map(card => {
        console.log(card)
        queryCobaltCard({frameWSAddress: frameWSAddress, cardNumber: card.slot})
      })
    
    const results = await Promise.allSettled(cardResponsePromises)

  } catch (error) {
    console.error(`WebSocket query to ${frameWSAddress} failed.`)
    console.error(error.message)
  }
}

await queryCobaltFrame(Deno.env.get("TEST_ADDRESS") as string)


// endpoint: /metrics/frameaddress

// query frame for card locations

// query each location for menuID

// depending on product result query appropriate menu ID

// guess if unknown

