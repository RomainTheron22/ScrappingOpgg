const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { execSync } = require('child_process');

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
    const players = [
      { url: 'https://op.gg/lol/summoners/euw/PichiaPastoris-667', name: 'PichiaPastoris-667' },
      { url: 'https://op.gg/lol/summoners/euw/Starfilleur-Bismi', name: 'Starfilleur-Bismi' },
      { url: 'https://op.gg/lol/summoners/euw/Zioon-777', name: 'Zion-777' },
      { url: 'https://op.gg/lol/summoners/euw/Fan2chokbar-EUW', name: 'Fan2chokbar-EUW' }
    ];

    const stats = [];
    for (const player of players) {
      const playerStats = await scrapePlayerStats(player.url, player.name);
      stats.push(playerStats);
    }

    const result = { player_stats: stats };

    // Écriture dans le fichier JSON
    fs.writeFileSync('rank.json', JSON.stringify(result, null, 2));
    console.log('✅ Data written to rank.json:', result);

    // Ajout du fichier au staging (forcé au cas où il est ignoré)
    execSync('git add -f rank.json');

    // Vérifie s’il y a des changements à committer
    const changes = execSync('git status --porcelain').toString().trim();

    if (changes) {
      execSync('git config user.name "GitHub Actions"');
      execSync('git config user.email "actions@github.com"');
      execSync('git commit -m "Mise à jour des stats de 4 joueurs"');
      execSync('git push origin main');
      console.log('✅ Changes pushed to the repository');
    } else {
      console.log('ℹ️ Aucun changement détecté. Pas de commit nécessaire.');
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
})();
