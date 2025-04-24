const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { execSync } = require('child_process'); // Pour exécuter les commandes Git

// Fonction pour scraper les données d'un joueur
async function scrapePlayerStats(playerUrl, playerName) {
  const { data: html } = await axios.get(playerUrl);
  const $ = cheerio.load(html);

  // Extraction des informations
  const rank = $('strong.text-xl').text().trim();
  const points = $('span.text-xs.text-gray-500').text().trim();
  const record = $('div.text-right span.leading-\\[26px\\]').text().trim();
  const winRateText = $('div.text-right span').eq(1).text().trim();
  
  // Extraction du pourcentage de victoire
  const winRateMatch = winRateText.match(/(\d+)%/);
  const winPercentage = winRateMatch ? winRateMatch[1] : '';  // Extraction du pourcentage de victoire

  // Retourner les données formatées
  return {
    player: playerName,
    rank: rank,
    points: points,
    win_rate: record,
    "win_%": winPercentage  // Utilisation des guillemets autour de la clé
  };
}

(async () => {
  try {
    // Scraping des stats pour PichiaPastoris
    const pichiaStats = await scrapePlayerStats('https://op.gg/lol/summoners/euw/PichiaPastoris-667', 'PichiaPastoris');
    
    // Scraping des stats pour Starfilleur-Bismi
    const starfilleurStats = await scrapePlayerStats('https://op.gg/lol/summoners/euw/Starfilleur-Bismi', 'Starfilleur-Bismi');

    // Création du fichier JSON avec les données des deux joueurs
    const result = {
      player_stats: [pichiaStats, starfilleurStats]
    };

    // Écriture dans le fichier JSON
    fs.writeFileSync('rank.json', JSON.stringify(result, null, 2));

    console.log('✅ Data written to rank.json:', result);

    // Configure Git user identity
    execSync('git config user.name "GitHub Actions"');
    execSync('git config user.email "actions@github.com"');

    // Stage only the rank.json file (ignore node_modules and other files)
    execSync('git add rank.json');
    
    // Commit the changes
    execSync('git commit -m "Mise à jour des stats de PichiaPastoris et Starfilleur-Bismi"');
    
    // Push the changes to the remote repository
    execSync('git push origin main');

    console.log('✅ Changes pushed to the repository');

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
})();
