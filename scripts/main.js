import { SelectActionPanel } from "./SelectActionPanel.js";

export const localize = key => game.i18n.localize(`CombatInteractions.${key}`);

export const moduleName = "combat-interactions";

const types = ["Inherent", "Contingent", "Temporal", "Analytic", "Collective"];
const typeFailMap = {
    Inherent: ["Contingent", "Temporal"],
    Contingent: ["Temporal", "Analytic"],
    Temporal: ["Analytic", "Collective"],
    Analytic: ["Collective", "Inherent"],
    Collective: ["Inherent", "Contingent"]
};

export const impactMap = {
    Inherent: "Focus",
    Contingent: "Attrition",
    Temporal: "Events",
    Analytic: "Skills",
    Collective: "Hit Points"
};


Hooks.once("init", () => {
    // Register socket handler for when Player users initiate resolution phase
    game.socket.on(`module.${moduleName}`, data => {
        if (data.action === "resolution") {
            if (game.user.id === game.users.find(u => u.active && u.isGM)?.id) return resolutionPhase(data.combatID);
        }
    });
});

Hooks.once("ready", () => {
    if (game.modules.get("resourcesplus")?.active) {
        if (game.settings.get("resourcesplus", "localLimit") < 8) game.settings.set("resourcesplus", "localLimit", 8);
        if (game.settings.get("resourcesplus", "globalLimit") < 8)game.settings.set("resourcesplus", "globalLimit", 8);
    }
});


Hooks.on("preCreateActor", (actor, data, options) => {
    if (!game.modules.get("resourcesplus")?.active) return;

    const resourceTemplate = {
        "primary": {
            "value": null,
            "max": null,
            "sr": false,
            "lr": false,
            "label": "Control"
        },
        "secondary": {
            "value": null,
            "max": null,
            "sr": false,
            "lr": false,
            "label": "Attrition"
        },
        "tertiary": {
            "value": null,
            "max": null,
            "sr": false,
            "lr": false,
            "label": "Breath"
        },
        "fourth": {
            "lr": false,
            "max": null,
            "sr": false,
            "value": null,
            "label": "Focus"
        },
        "fifth": {
            "lr": false,
            "max": null,
            "sr": false,
            "value": 0,
            "label": "Recover"
        },
        "sixth": {
            "lr": false,
            "max": null,
            "sr": false,
            "value": null,
            "label": "Events"
        },
        "seventh": {
            "lr": false,
            "max": null,
            "sr": false,
            "value": null,
            "label": "Skills"
        },
        "eighth": {
            "lr": false,
            "max": null,
            "sr": false,
            "value": null,
            "label": "Experience"
        },
        "ninth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "tenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "eleventh": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "twelfth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "thirteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "fourteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "fifteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "sixteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "seventeenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "eighteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "nineteenth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "twentieth": {
            "label": "",
            "sr": false,
            "value": null,
            "max": null,
            "lr": false
        },
        "count": {
            "label": "Resource Count",
            "sr": false,
            "value": 7,
            "max": 8,
            "lr": false
        }
    };
    actor.data.update({ "data.resources": resourceTemplate });
});

Hooks.on("renderItemSheet5e", (app, html, data) => {
    if (app.object.type !== "feat") return;

    const typesObject = types.reduce((acc, current) => {
        acc[current] = current;
        return acc;
    }, {});

    for (const [k, v] of Object.entries(typesObject)) {
        typesObject[k] = v + ` (${impactMap[k]})`;
    }

    const effectObject = {
        Positive: "Positive",
        Negative: "Negative"
    };

    html[0].querySelector(`h4.item-type`).innerText = `Skill`;

    const detailsTab = html[0].querySelector(`div.tab.details`);
    detailsTab.innerHTML = `
        <h3 class="form-header">Skill Details</h3>

        <div class="form-group input-select">
            <label>Type (Impact)</label>
            <div class="form-fields">
                <select name="flags.${moduleName}.type">
                    ${Handlebars.helpers.selectOptions(typesObject, { hash: { selected: app.object.getFlag(moduleName, "type") } })}
                </select>
            </div>
        </div>

        <!-- 
        <div class="form-group input-select">
            <label>Impact</label>
            <div class="form-fields">
                <select disabled>
                    <option>${impactMap[app.object.getFlag(moduleName, "type")]}</option>
                </select>
            </div>
        </div>
        -->

        <div class="form-group input-select">
            <label>Effect</label>
            <div class="form-fields">
                <select name="flags.${moduleName}.effect">
                    ${Handlebars.helpers.selectOptions(effectObject, { hash: { selected: app.object.getFlag(moduleName, "effect") } })}
                </select>
            </div>
        </div>
    `;
});

Hooks.on("renderCombatTracker", (app, html, data) => {
    // Add Select Action button to combat tracker
    html[0].querySelectorAll(`div.token-initiative`).forEach(n => {
        const combatantLI = n.closest("li");
        const combatant = game.combat.combatants.get(combatantLI.dataset.combatantId);
        if (!combatant.isOwner) return;

        const selectActionDiv = document.createElement("div");
        selectActionDiv.classList.add("token-initiative");
        const button = document.createElement("a");
        button.classList.add(`${moduleName}-select-action`);
        if (combatant.getFlag(moduleName, "action")) button.classList.add("active");
        button.title = localize("SelectAction");
        button.addEventListener("click", ev => {
            ev.preventDefault();
            ev.stopPropagation();

            new SelectActionPanel(combatant, game.combat).render(true);
        });
        selectActionDiv.append(button);

        n.before(selectActionDiv);
    });
});

Hooks.on("preUpdateCombat", (combat, diff, options, userID) => {
    if (!foundry.utils.hasProperty(diff, "round")) return;

    // Skip on "Begin Combat";
    if (diff.round <= 1) return;

    // Skip when going to previous round;
    if (combat.round > diff.round) return;

    // If new round is started, initiate resolution of current round actions
    if (!game.user.isGM) return game.socket.emit(`module.${moduleName}`, { action: "resolution", combatID: combat.id });
    else return resolutionPhase(combat.id);
});


// Resolution phase handler
async function resolutionPhase(combatID) {
    console.log("Initiating resolution phase");

    // Temporarily disable combat control buttons
    document.querySelectorAll(`a.combat-control`).forEach(n => n.style["pointer-events"] = "none");

    const combat = game.combats.get(combatID);
    if (!combat) return;

    const combatants = combat.combatants.contents;

    // Perform action-relevant roll for each combatant
    for (const combatant of combatants) {
        const { actor } = combatant;
        const userID = getActorOwner(actor.id)

        const { target, skill } = combatant.getFlag(moduleName, "action") || {};
        if (!target && !skill) continue;

        const skillItem = combatant.actor.items.getName(skill);

        const targetCombatant = combat.combatants.get(target);

        // Perform roll
        /*  
         const roll = await new Roll(`1d6`).roll();
         await combatant.setFlag(moduleName, "action.total", roll.total);
         if (game.dice3d) {
             await game.dice3d.showForRoll(roll, game.users.get(userID), true); // may have to blind/hide something here
             Hooks.once("diceSoNiceRollStart", (messageID, context) => context.blind = true);
         }
         await roll.toMessage({
             speaker: ChatMessage.getSpeaker({ token: combatant.token }),
             flavor: `Skill: ${skill} | Target: ${targetCombatant.name}`
         });
         */

        // Push data to target contest flag
        const contestData = targetCombatant.getFlag(moduleName, "contest") || [];
        contestData.push({
            combatantID: combatant.id,
            skill: {
                name: skillItem.name,
                type: skillItem.getFlag(moduleName, "type"),
                effect: skillItem.getFlag(moduleName, "effect"),
            },
            //total: roll.total
        });
        await targetCombatant.setFlag(moduleName, "contest", contestData);

        // Decrease Breath and Events
        await updateResource(actor, "Breath", false);
        await updateResource(actor, "Events", false);
    }

    // Resolve contests
    for (const targetCombatant of combatants) {
        const contests = targetCombatant.getFlag(moduleName, "contest");
        if (!contests) continue;

        let content = `Targeting ${targetCombatant.name} <hr>`;

        // Create chat message for each target
        const successCounter = {};
        for (const contest of contests) {
            const { skill } = contest;
            const attacker = combat.combatants.get(contest.combatantID);
            if (!successCounter[attacker.id]) successCounter[attacker.id] = ``;

            const contestingSkills = contests.filter(c => c.skill.effect !== skill.effect).map(c => c.skill);

            if (!contestingSkills.length) {
                // Uncontested successs
                // Increase Experience
                await updateResource(attacker.actor, "Experience");

                // Apply impact to target
                await updateResource(targetCombatant.actor, impactMap[skill.type], skill.effect === "Positive");
            } else {
                const successes = [];
                const failures = [];
                contestingSkills.forEach(s => {
                    const targetArray = typeFailMap[skill.type].includes(s.type) ? failures : successes;
                    targetArray.push(s);
                    if (targetArray === successes) successCounter[attacker.id] += ` (S)`;
                    else successCounter[attacker.id] += ` (F)`;
                });

                for (const failure of failures) {
                    // Decrease Control
                    await updateResource(attacker.actor, "Control", false);
                }

                for (const success of successes) {
                    // Increase Experience
                    await updateResource(attacker.actor, "Experience");

                    // Increase Recover
                    await updateResource(attacker.actor, "Recover");

                    // Apply impact to target
                    console.log(`${attacker.name} applying ${impactMap[skill.type]} (${skill.effect}) to ${targetCombatant.name}`);
                    await updateResource(targetCombatant.actor, impactMap[skill.type], skill.effect === "Positive");
                }
            }

            content += `
                ${attacker.name} | ${contest.skill.name}${successCounter[attacker.id]}
                <hr>
            `;
        }

        await ChatMessage.create({
            content,
            whisper: game.users.filter(u => u.isGM)
        });
    }

    // Reset flag data
    for (const combatant of combatants) {
        await combatant.unsetFlag(moduleName, "action");
        await combatant.unsetFlag(moduleName, "contest");
    }

    // Re-enable combat control buttons
    document.querySelectorAll(`a.combat-control`).forEach(n => n.style["pointer-events"] = "");
}

// Get the owner of an actor, or return a GM user if none
function getActorOwner(actorID) {
    const actor = game.actors.get(actorID);

    for (const [userID, permission] of Object.entries(actor.data.permission)) {
        if (userID === "default") continue;
        if (game.users.get(userID).isGM) continue;

        if (permission === 3) return userID;
    }

    return game.users.find(u => u.isGM && u.active)?.id;
}

async function updateResource(actor, resourceName, increase = true) {
    if (resourceName === "Hit Points") return actor.applyDamage(increase ? -1 : 1);

    const resource = Object.entries(actor.data.data.resources).find(([k, v]) => v.label === resourceName);
    if (resource) {
        //const newEvent = Math.max(0, resource[1].value + (increase ? 1 : -1));
        const newEvent = resource[1].value + (increase ? 1 : -1);
        return actor.update({ [`data.resources.${resource[0]}.value`]: newEvent });
    }
}
