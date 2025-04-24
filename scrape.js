const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { execSync } = require('child_process'); // Pour exécuter les commandes Git

// Fonction pour scraper les données d'un joueur
async function scrapePlayerStats(playerUrl, playerName) {
  const { data: html } = await axios.get(playerUrl);
  const $ = cheerio.load(html);

  const rank = $('strong.text-xl').text().trim();
  const points = $('span.text-xs.text-gray-500').text().trim();
  const record = $('div.text-right span.leading-\\[26px\\]').text().trim();
  const winRateText = $('div.text-right span').eq(1).text().trim();
  const winRateMatch = winRateText.match(/(\d+)%/);
  const winPercentage = winRateMatch ? winRateMatch[1] : '';

  return {
    player: playerName,
    rank: rank,
    points: points,
    win_rate: record,
    "win_%": winPercentage
  };
}

(async () => {
  try {
    // Liste des joueurs à scraper
    const players = [
      { url: 'https://op.gg/lol/summoners/euw/PichiaPastoris-667', name: 'PichiaPastoris-667' },
      { url: 'https://op.gg/lol/summoners/euw/Starfilleur-Bismi', name: 'Starfilleur-Bismi' },
      { url: 'https://op.gg/lol/summoners/euw/Zioon-777', name: 'Zion-777' }, // Exemple à modifier
      { url: 'https://op.gg/lol/summoners/euw/Fan2chokbar-EUW', name: 'Fan2chokbar-EUW' } // Exemple à modifier
    ];

    const stats = [];
    for (const player of players) {
      const playerStats = await scrapePlayerStats(player.url, player.name);
      stats.push(playerStats);
    }

    const result = { player_stats: stats };
    fs.writeFileSync('rank.json', JSON.stringify(result, null, 2));
    console.log('✅ Data written to rank.json:', result);

    execSync('git config user.name "GitHub Actions"');
    execSync('git config user.email "actions@github.com"');
    execSync('git add rank.json');
    execSync('git commit -m "Mise à jour des stats de 4 joueurs"');
    execSync('git push origin main');

    console.log('✅ Changes pushed to the repository');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
})();
