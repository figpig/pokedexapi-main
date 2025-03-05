import express from "express";
import fetch from "node-fetch";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));

// Muuntaa numerot roomalaisiksi
function romanize(num) {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    return roman[num - 1] || num;
}

// Etusivu, joka näyttää generaatioiden linkit
app.get("/", (req, res) => {
    const generations = Array.from({ length: 9 }, (_, i) => i + 1);
    const generationData = generations.map(num => ({
        number: num,
        roman: romanize(num)
    }));

    res.render("index", { generations: generationData });
});

// Generaatiokohtainen reitti
app.get("/generation/:number", async (req, res) => {
    const number = parseInt(req.params.number, 10);
    if (isNaN(number) || number < 1 || number > 9) {
        return res.status(400).send("Invalid generation number.");
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${number}/`);
        if (!response.ok) throw new Error("Generation not found");

        const data = await response.json();

        const pokemonList = data.pokemon_species.map(pokemon => ({
            name: pokemon.name,
            url: `/pokemon/${pokemon.name}`
        }));

        res.render("generation", { number: romanize(number), pokemonList });
    } catch (error) {
        res.status(500).send("Error fetching generation data.");
    }
});

// Pokemonin yksittäinen reitti
app.get("/pokemon/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`);
        if (!response.ok) return res.status(404).send("Pokemon not found!");

        const data = await response.json();

        const pokemon = {
            name: data.name,
            sprite: data.sprites.front_default,
            types: data.types.map(t => t.type.name),
            stats: data.stats.reduce((acc, stat) => {
                acc[stat.stat.name] = stat.base_stat;
                return acc;
            }, {})
        };

        res.render("pokemon", { pokemon });
    } catch (error) {
        res.status(500).send("Error fetching Pokemon data.");
    }
});

// Käynnistetään palvelin
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
