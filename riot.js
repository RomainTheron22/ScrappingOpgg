import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const REGION = "euw1";
const RIOT_API_KEY = process.env.RIOT_API_KEY;

const summoners = JSON.parse(fs.readFileSync("summoners.json", "utf-8"));
const output = {};

async function fetchSummonerData(name) {
  const baseUrl = `https://${REGION}.api.riotgames.com`;

  // 1. Infos de base (id, puuid...)
  const summonerRes = await fetch(`${baseUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });
  const summoner = await summonerRes.json();

  // 2. Classement (SoloQ)
  const leagueRes = await fetch(`${baseUrl}/lol/league/v4/entries/by-summoner/${summoner.id}`, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });
  const leagues = await leagueRes.json();

  const soloQ = leagues.find(entry => entry.queueType === "RANKED_SOLO_5x5");

  return {
    name: summoner.name,
    tier: soloQ?.tier ?? "UNRANKED",
    rank: soloQ?.rank ?? "",
    lp: soloQ?.leaguePoints ?? 0,
    wins: soloQ?.wins ?? 0,
    losses: soloQ?.losses ?? 0,
  };
}

(async () => {
  for (const summoner of summoners) {
    output[summoner] = await fetchSummonerData(summoner);
  }

  fs.writeFileSync("rank.json", JSON.stringify(output, null, 2));
  console.log("✅ Données mises à jour depuis l'API Riot !");
})();