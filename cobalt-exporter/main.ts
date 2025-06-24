import { SlotResponse, AllSlotsResponse } from "./types.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";

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
      socket.close()
      reject(new Error(`Websocket connection to ${wsAddress} timed out after ${timeout}ms.`))
    }, timeout)
    const socket = new WebSocket(wsAddress);
    socket.onopen = () => {
      socket.send(message);
    }
    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.id === expectedResponseID) {
        socket.close();
        resolve(data)
      } 
    };
  })
}

const findCardProductNames = (menuGroupsResponse) => {  
  try {
    const statusMenuGroup = menuGroupsResponse.menugroups.find(item => item.menugroupType === 'status');
    const productMenu = statusMenuGroup.menus.find(item => item.name.includes('Product'));
    return productMenu.subMenus.map(item => item.name).join(', ');
  } catch (error) {
    return "Unknown Product" // TODO find more product types by querying the OID returned in productMenu 
  }
}

const getStatusMenuID = (menuGroupsResponse) => {
  try {
    const statusMenuID = menuGroupsResponse.menugroups.findIndex(item => item.menugroupType === 'status');
    return statusMenuID;
  } catch (error) {
    console.error(error.message)
    return undefined;
  }
}

const parseCardMetrics = (statusMenuResponse, slotNumber: number, cardName: string) => {
  try {
    // return JSON.stringify(statusMenuResponse, null, 2);
    let responseString = ""
    for (let parameter of statusMenuResponse.parameters) {
      if (typeof parameter.value === 'number'){
        const cleanedName = parameter.name
          .replaceAll(' ', '_')
          .replaceAll('(','')
          .replaceAll(')','')
          .toLowerCase()
        responseString += `${cleanedName}{slot="${slotNumber}",card_name="${cardName}"} ${parameter.value} \n`
      }
    }
    return responseString
  } catch (error) {
    console.error(error.message)
  }
}

interface queryCobaltCardOptions {
  frameWSAddress: string,
  cardNumber: number,
  cardName: string,
}

const queryCobaltCard = async ({
  frameWSAddress,
  cardNumber,
  cardName
}: queryCobaltCardOptions) => {
  try {
    const menuGroupsResponse = await webSocketQuery({
      wsAddress: `http://${frameWSAddress}/rosetta_api/slots/${cardNumber}`,
      message: `{"menugroups":"all","method":"get","id":0}`,
      expectedResponseID: 0,
    })

    const statusMenuID = getStatusMenuID(menuGroupsResponse);

    const statusMenuResponse = await webSocketQuery({
      wsAddress: `http://${frameWSAddress}/rosetta_api/slots/${cardNumber}`,
      message: `{"oids":"all","menuId":${statusMenuID},"method":"get","id":1}`,
      expectedResponseID: 1,
    })

    return parseCardMetrics(statusMenuResponse, cardNumber, cardName);

  } catch (error) {
    console.error(`Error while querying card ${cardNumber} in the frame at ${frameWSAddress}.`)
    console.error(error.message)
    return "oh"
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
        return queryCobaltCard({frameWSAddress: frameWSAddress, cardNumber: card.slot, cardName: card.name})
      })
    
    const results = (await Promise.allSettled(cardResponsePromises)).filter(result => result.status === 'fulfilled').map(result => result.value)
    return results.join('\n');

  } catch (error) {
    console.error(`WebSocket query to ${frameWSAddress} failed.`)
    console.error(error.message)
    return null;
  }
}

// await queryCobaltFrame(Deno.env.get("TEST_ADDRESS"))

const router = new Router();
router.get("/metrics/:address", async (ctx) => {
  ctx.response.body = await queryCobaltFrame(ctx.params.address);
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());
app.listen({ port: 9000 });

console.log('hello from cobalt-exporter')
// endpoint: /metrics/frameaddress

// query frame for card locations

// query each location for menuID

// depending on product result query appropriate menu ID

// guess if unknown

