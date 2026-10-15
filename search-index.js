/* SupplementScore — universal search index.
 *
 * Reads top-level const bindings from data.js (S, CONDITIONS, MEDS,
 * BIOMARKERS, ARTICLES_BY_ID, ARTICLE_MAP, TM). In browsers, separate
 * <script> tags in the same realm share the script-scope, so bare
 * references resolve fine. typeof guards keep this safe if data.js
 * failed to load.
 *
 * Exposes window.SS with search() and per-type lookups + helpers.
 */
(function () {
  'use strict';

  // --- safe readers (return defaults if a binding is missing) ---
  function _S()              { try { return (typeof S              !== 'undefined') ? S              : []; } catch (_) { return []; } }
  function _CONDITIONS()     { try { return (typeof CONDITIONS     !== 'undefined') ? CONDITIONS     : {}; } catch (_) { return {}; } }
  function _MEDS()           { try { return (typeof MEDS           !== 'undefined') ? MEDS           : {}; } catch (_) { return {}; } }
  function _BIOMARKERS()     { try { return (typeof BIOMARKERS     !== 'undefined') ? BIOMARKERS     : {}; } catch (_) { return {}; } }
  function _ARTICLES_BY_ID() { try { return (typeof ARTICLES_BY_ID !== 'undefined') ? ARTICLES_BY_ID : {}; } catch (_) { return {}; } }
  function _ARTICLE_MAP()    { try { return (typeof ARTICLE_MAP    !== 'undefined') ? ARTICLE_MAP    : {}; } catch (_) { return {}; } }
  function _TM()             { try { return (typeof TM             !== 'undefined') ? TM             : null; } catch (_) { return null; } }

  function slugify(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* SS_STATIC_SLUGS:start */
  var STATIC_SUPPLEMENT_SLUGS = {"oral-rehydration-salts":1,"electrolyte-replacement":1,"creatine-monohydrate":1,"psyllium-husk":1,"oat-beta-glucan":1,"caffeine":1,"protein-supplementation":1,"electrolyte-complex":1,"lactase-enzyme":1,"fibre":1,"vitamin-b1":1,"l-leucine":1,"vitamin-b2":1,"melatonin":1,"l-theanine-caffeine":1,"whey-protein":1,"sodium-bicarbonate":1,"vitamin-d3":1,"zinc":1,"magnesium":1,"vitamin-b12":1,"magnesium-glycinate":1,"methylcobalamin":1,"potassium-supplementation":1,"calcium":1,"lactobacillus-rhamnosus-gg":1,"saccharomyces-boulardii":1,"l-carnitine":1,"bifidobacterium-infantis-evc001":1,"omega-3":1,"bifidobacterium-infantis-35624":1,"magnesium-citrate":1,"inositol":1,"inositol-myo-form":1,"calcium-carbonate-citrate":1,"limosilactobacillus-reuteri-dsm-17938":1,"folate":1,"glycine":1,"ginger":1,"peppermint-oil":1,"phytosterols":1,"vitamin-d3-liquid-drops":1,"zinc-picolinate":1,"folic-acid":1,"acerola-cherry-extract":1,"citrulline-malate":1,"vitamin-c":1,"tyrosine":1,"resistant-starch":1,"ferrous-bisglycinate":1,"carnosyn-beta-alanine":1,"cluster-dextrin":1,"nicotinic-acid":1,"lactobacillus-plantarum-299v":1,"collagen-peptides":1,"myo-inositol":1,"dha":1,"lactobacillus-acidophilus":1,"pancreatin":1,"algal-dha":1,"cranberry-pac":1,"boswellia-serrata":1,"l-theanine":1,"casein-protein":1,"eaas":1,"biotin":1,"dgl-licorice":1,"pea-protein":1,"egg-white-protein":1,"chamomile-extract":1,"benfotiamine":1,"theaflavins":1,"citrulline":1,"niacinamide":1,"lactobacillus-gasseri":1,"acacia-fiber":1,"calcium-pantothenate":1,"b-complex":1,"vitamin-a":1,"potassium-citrate":1,"cranberry-extract":1,"vitamin-k1":1,"lavender-oil-oral":1,"diosmin":1,"zinc-gluconate":1,"saffron":1,"palmitoylethanolamide":1,"sunfiber":1,"methylsulfonylmethane":1,"lactobacillus-plantarum":1,"mct-oil":1,"beta-glucan":1,"zinc-carnosine":1,"cacao-flavanols":1,"bifidobacterium-lactis":1,"lactobacillus-casei-shirota":1,"carnitine-tartrate":1,"palmitoylethanolamide-co-micronised":1,"partially-hydrolysed-guar-gum":1,"bifidobacterium-longum-bb536":1,"lactobacillus-helveticus-b-longum-r0052-r0175":1,"d-chiro-inositol":1,"galacto-oligosaccharides":1,"zinc-bisglycinate":1,"anthocyanin-concentrate":1,"beta-alanine":1,"vsl-3-visbiome":1,"magnesium-malate":1,"saccharomyces-cerevisiae-beta-glucan":1,"coq10":1,"iron":1,"tart-cherry":1,"riboflavin":1,"lactoferrin":1,"bifidobacterium-longum":1,"lycopene":1,"glucomannan":1,"lactobacillus-reuteri":1,"pomegranate-extract":1,"phosphorus":1,"hydroxytyrosol":1,"choline-bitartrate":1,"olive-polyphenol-complex":1,"beta-hydroxy-beta-methylbutyrate-free-acid":1,"glycerol-hyperhydration":1,"hydroxocobalamin":1,"adenosylcobalamin":1,"folinic-acid":1,"eggshell-membrane":1,"broccoli-sprout-extract":1,"riboflavin-5-phosphate":1,"magnafolate":1,"probiotics":1,"lutein-zeaxanthin":1,"bifidobacterium-breve":1,"molybdenum":1,"caprylic-acid":1,"rutin":1,"l-arginine":1,"lactobacillus-crispatus":1,"amla-indian-gooseberry":1,"saffron-affron":1,"hesperidin-methyl-chalcone":1,"proline":1,"chondroitin-sulfate":1,"capsinoids":1,"ashwagandha":1,"elderberry":1,"taurine":1,"digestive-enzymes":1,"bromelain":1,"andrographis-paniculata":1,"spore-based-probiotics":1,"pantothenic-acid":1,"artichoke-extract":1,"betaine-tmg":1,"aged-garlic-extract":1,"pelargonium-sidoides":1,"ivy-leaf-extract":1,"thyme-extract":1,"melatonin-extended-release":1,"zeaxanthin":1,"lutein":1,"l-glutamine":1,"evening-primrose-oil":1,"green-lipped-mussel":1,"pyridoxal-5-phosphate":1,"bacillus-clausii":1,"algal-oil":1,"pumpkin-seed-oil":1,"partially-hydrolyzed-guar-gum":1,"iberogast":1,"bacillus-coagulans-gbi-30":1,"lactobacillus-acidophilus-ncfm":1,"nac":1,"iodine":1,"theacrine":1,"dihydromyricetin":1,"elderberry-zinc-combo":1,"hesperidin":1,"bilberry-extract":1,"butterbur":1,"magnesium-taurate":1,"flaxseed-oil":1,"marine-collagen":1,"l-carnosine":1,"plant-ceramides":1,"dietary-nitrate-beetroot":1,"choline":1,"phosphatidylcholine":1,"wobenzym":1,"sulforaphane":1,"omega-3-dha-dominant":1,"american-ginseng":1,"senna-leaf":1,"l-cysteine":1,"bacillus-subtilis":1,"fenugreek-seed-extract":1,"trimethylglycine":1,"hibiscus-sabdariffa":1,"moringa-oleifera":1,"curcumin":1,"tributyrin-butyrate":1,"ox-bile":1,"magnesium-l-threonate":1,"andrographis-echinacea-combo":1,"butyrate":1,"algal-epa":1,"pharmagaba":1,"ttfd-allithiamine":1,"uridine-monophosphate":1,"lemon-verbena-extract":1,"rhodiola-rosea":1,"milk-thistle":1,"acetyl-l-carnitine":1,"citicoline":1,"niacin":1,"fenugreek":1,"bcaas":1,"d-mannose":1,"stinging-nettle-root":1,"glutathione":1,"beta-sitosterol":1,"chlorogenic-acid":1,"lacto-fermented-foods":1,"l-lysine":1,"tudca":1,"krill-oil":1,"pantethine":1,"vitex-chasteberry":1,"devil-s-claw":1,"cod-liver-oil":1,"turmeric-whole-root-powder":1,"calendula":1,"omega-3-triglyceride-form":1,"boswellic-acids-akba":1,"chromium-gtf":1,"phosphatidylserine":1,"silymarin-phytosome":1,"coriolus-versicolor-psp-psk":1,"bergamot-citrus-polyphenol-extract":1,"5-ala":1,"ferulic-acid":1,"idebenone":1,"mitoq":1,"gamma-tocopherol":1,"korean-red-ginseng":1,"inulin-fos":1,"betaine-hcl":1,"manganese":1,"mastic-gum":1,"red-yeast-rice":1,"hmb-free-acid":1,"banaba-leaf":1,"magnolia-bark":1,"quercetin-phytosome-bromelain":1,"silicon":1,"calcium-alpha-ketoglutarate":1,"2-fucosyllactose":1,"psk-psp":1,"berberine":1,"vitamin-k2":1,"hmb":1,"selenium":1,"vitamin-b6":1,"olive-leaf-extract":1,"astragalus":1,"copper":1,"gamma-linolenic-acid":1,"s-adenosylmethionine":1,"collagen-vitamin-c-stack":1,"n-acetyl-glucosamine":1,"hmb-creatine-stack":1,"k2-d3-combo":1,"milk-peptides":1,"n-acetyl-tyrosine":1,"hawthorn-berry":1,"larch-arabinogalactan":1,"meriva-curcumin":1,"postbiotics":1,"lactobacillus-fermentum":1,"streptococcus-thermophilus":1,"perilla-seed-oil":1,"pycnogenol":1,"ketone-esters":1,"hydrogen-water":1,"soy-isoflavones":1,"kaempferol":1,"diindolylmethane":1,"carob-extract":1,"delta-tocotrienol":1,"dmg":1,"mucuna-pruriens":1,"tongkat-ali":1,"olive-leaf-polyphenols":1,"urolithin-a":1,"collagen-type-ii":1,"oleuropein":1,"hemp-seed-oil":1,"melatonin-gummies":1,"glynac":1,"vitamin-d2":1,"hemp-protein":1,"rooibos-extract":1,"calcium-fructoborate":1,"guduchi":1,"centella-asiatica":1,"piracetam":1,"beef-organ-complex":1,"egcg-concentrate":1,"ghk-cu":1,"st-john-s-wort":1,"glucosamine-chondroitin":1,"saw-palmetto":1,"hyaluronic-acid":1,"olive-oil-extract":1,"black-garlic-extract":1,"berberine-hcl":1,"brewer-s-yeast":1,"white-willow-bark":1,"nettle-leaf":1,"hyaluronic-acid-chondroitin-stack":1,"inositol-hexanicotinate":1,"sacha-inchi-oil":1,"perilla-oil":1,"chia-seed-oil":1,"multivitamins":1,"black-cohosh":1,"glycerophosphocholine":1,"cissus-quadrangularis":1,"gymnema-sylvestre":1,"huperzine-a":1,"echinacea-purpurea":1,"bone-broth-protein":1,"maitake-mushroom":1,"calcium-hydroxyapatite":1,"arjuna-bark":1,"baobab-powder":1,"tocotrienols":1,"berberis-aristata":1,"glucosamine-hcl":1,"luteolin":1,"icariin":1,"gotu-kola":1,"goji-berry":1,"bacopa-monnieri":1,"alpha-lipoic-acid":1,"valerian-root":1,"glutamine":1,"vitamin-e":1,"nattokinase":1,"apigenin":1,"conjugated-linoleic-acid":1,"passionflower":1,"horse-chestnut":1,"red-clover":1,"marshmallow-root":1,"d-ribose":1,"dandelion-root":1,"coconut-oil":1,"bitter-melon":1,"rosemary-extract":1,"l-ornithine":1,"oat-straw-extract":1,"jujube":1,"nopal-cactus-prickly-pear":1,"nigella-sativa-standardised":1,"dan-shen-compound":1,"terminalia-arjuna":1,"barley-grass-powder":1,"trehalose":1,"ellagic-acid":1,"blackcurrant-extract":1,"oat-avenanthramides":1,"chanca-piedra":1,"potassium-gluconate":1,"chromium-nicotinate":1,"borage-oil":1,"calamari-oil":1,"digestive-bitters":1,"mullein-leaf":1,"nicotinamide-riboside":1,"black-rice-extract":1,"berberine-containing-coptis":1,"d-glucuronolactone":1,"yohimbine-hcl":1,"alpha-gpc":1,"black-seed-oil":1,"lemon-balm":1,"gaba":1,"elderflower-extract":1,"methyl-b12-methylfolate-combo":1,"slippery-elm":1,"sambucol":1,"r-alpha-lipoic-acid":1,"triphala":1,"activated-b-complex":1,"ip-6":1,"caralluma-fimbriata":1,"gamma-oryzanol":1,"nadh":1,"creatine-hcl":1,"california-poppy":1,"shiitake-extract":1,"l-serine":1,"mixed-carotenoids":1,"white-mulberry-leaf":1,"phycocyanin":1,"ginkgo-biloba-egb-761":1,"andrographis":1,"punarnava":1,"emodin-free-rhubarb-extract":1,"epicatechin":1,"honokiol":1,"white-kidney-bean-extract":1,"squalene":1,"maqui-berry":1,"dlpa":1,"oleoylethanolamide":1,"magnesium-chloride":1,"boron-glycinate":1,"gynostemma-pentaphyllum":1,"tremella-fuciformis":1,"lion-s-mane-mushroom":1,"colostrum":1,"monolaurin":1,"korean-mistletoe":1,"eyebright":1,"collagen-type-iii":1,"meadowsweet":1,"spilanthes-acmella":1,"protocatechuic-acid":1,"capsaicin":1,"astaxanthin":1,"quercetin":1,"chlorella":1,"mushroom-complex":1,"maca":1,"enzyme-coq10-pqq-stack":1,"cordyceps-militaris":1,"turkey-tail":1,"rhodiola-crenulata":1,"grape-seed-extract":1,"policosanol":1,"manuka-honey":1,"pyruvate":1,"cinnamon-extract":1,"holy-basil":1,"pygeum-africanum":1,"shatavari":1,"silica":1,"baicalin":1,"phosphatidic-acid":1,"ergothioneine":1,"modified-citrus-pectin":1,"black-pepper-extract":1,"eleuthero":1,"cascara-sagrada":1,"d-aspartic-acid":1,"l-histidine":1,"sea-buckthorn-oil":1,"salacia-reticulata":1,"rehmannia-glutinosa":1,"shankhpushpi":1,"jiaogulan":1,"coenzyme-pqq":1,"vinpocetine":1,"fucoxanthin":1,"nad":1,"uva-ursi":1,"guarana":1,"yerba-mate":1,"alfalfa-leaf":1,"japanese-knotweed":1,"naringenin":1,"pterostilbene":1,"thiamine-ttfd":1,"cistus-incanus":1,"tryptophan":1,"lumbrokinase":1,"camu-camu":1,"dihydroberberine":1,"galangal-root":1,"adaptogen-stack":1,"pueraria-mirifica":1,"codonopsis-pilosula":1,"phloretin":1,"spirulina":1,"collagen-for-muscle-strength":1,"ginkgo-biloba":1,"pine-bark-extract":1,"pqq":1,"apple-cider-vinegar":1,"omega-7":1,"cistanche-deserticola":1,"resolvins-spms":1,"schisandra":1,"glutathione-precursors-blend":1,"avocado-soybean-unsaponifiables":1,"akkermansia-muciniphila":1,"aloe-vera":1,"raspberry-leaf":1,"soil-based-organisms":1,"magnesium-orotate":1,"papain":1,"oyster-mushroom-extract":1,"cistanche-tubulosa":1,"hericium-erinaceus-mycelium":1,"aniracetam":1,"hops":1,"jambolan":1,"ecklonia-cava":1,"fucoidan":1,"beta-carotene":1,"mangosteen":1,"ashitaba":1,"phellinus-linteus":1,"boron":1,"bee-propolis":1,"reishi":1,"sage-extract":1,"arachidonic-acid":1,"polygala-tenuifolia":1,"nootropic-peptide-selank":1,"phenylpiracetam":1,"nr-pterostilbene-stack":1,"semax":1,"corydalis-yanhusuo":1,"cannabigerol":1,"reishi-spore-oil":1,"nrh":1,"1-3-dmba":1,"2-4-dinitrophenol":1,"5-htp":1,"7-hydroxymitragynine":1,"7-keto-dhea":1,"acai-berry-extract":1,"aconite":1,"aconitum":1,"activated-charcoal":1,"agaricus-blazei":1,"agmatine-sulfate":1,"ahcc":1,"alpha-ketoglutarate":1,"amanita-muscaria":1,"andarine":1,"androstenedione":1,"androsterone":1,"aristolochic-acid":1,"astragaloside-iv":1,"bamboo-extract":1,"barberry":1,"bee-pollen":1,"belladonna":1,"bentonite-clay":1,"berberine-ceylon-cinnamon-combo":1,"biotin-low-dose-deficiency":1,"bitter-orange":1,"black-ant-extract":1,"black-cohosh-high-dose":1,"black-salve":1,"black-walnut-hull":1,"bladderwrack":1,"blue-green-algae":1,"bmpea":1,"borax":1,"bpc-157":1,"c60-fullerene":1,"calamus-root":1,"calcium-aep":1,"calcium-d-glucarate":1,"calomel":1,"camphor-oil":1,"cat-s-claw":1,"cbd":1,"cesium-chloride":1,"cetyl-myristoleate":1,"chaga":1,"chaparral":1,"chlorophyll-chlorophyllin":1,"chromium-picolinate":1,"chrysin":1,"clenbuterol":1,"coleus-forskohlii":1,"collagen-peptides-type-i-exercise-recovery":1,"colloidal-gold":1,"colloidal-minerals":1,"colloidal-silver":1,"coltsfoot":1,"comfrey":1,"comfrey-root-tea":1,"coq10-ubiquinone-classic-form":1,"coral-calcium":1,"croton-oil":1,"cycloastragenol":1,"damiana":1,"deer-antler-velvet":1,"deer-placenta-extract":1,"dendrobium-officinale":1,"detox-supplements":1,"dhea":1,"dhea-topical-cream":1,"diatomaceous-earth":1,"dim":1,"diuretic-supplements":1,"dmaa-dmha-novel-stimulant-pre-workouts":1,"dnp":1,"dong-quai":1,"emodin":1,"emu-oil":1,"ephedra-analogues":1,"essential-oils":1,"fadogia-agrestis":1,"fenugreek-ashwagandha-stack":1,"feverfew":1,"fisetin":1,"fo-ti":1,"foxglove":1,"fulvic-acid":1,"garcinia-cambogia":1,"germander":1,"ghb-precursors":1,"ghk-cu-peptide":1,"goldenseal":1,"grapefruit-seed-extract":1,"graviola":1,"greater-celandine":1,"green-tea-extract":1,"guggul":1,"helichrysum-italicum":1,"higenamine":1,"high-dose-fat-soluble-vitamins":1,"hordenine":1,"horny-goat-weed":1,"horsetail":1,"humic-acid":1,"hydrazine-sulfate":1,"indole-3-carbinol":1,"jimsonweed":1,"kava":1,"kelp":1,"khat":1,"khat-extract":1,"kratom":1,"kudzu":1,"laetrile":1,"licorice-root":1,"lithium-orotate":1,"lobelia":1,"ma-huang":1,"melanotan-ii":1,"melatonin-0-1-0-5-mg-physiological-dose":1,"melatonin-high-dose-nightly":1,"methyl-1-testosterone":1,"methyl-synephrine":1,"methylene-blue":1,"methylsynephrine":1,"miracle-mineral-supplement":1,"mitoquinol":1,"moringa":1,"mots-c":1,"myrrh-resin":1,"nad-iv-infusion-therapy":1,"neem":1,"nmn-nad-precursors":1,"noni-juice":1,"oil-of-oregano":1,"oil-of-wintergreen":1,"oleander-extract":1,"omega-3-6-9-blends":1,"omega-3-high-dose":1,"oregano-oil":1,"ostarine":1,"oxiracetam":1,"palmitoyl-tripeptide-1":1,"panax-ginseng":1,"pau-d-arco":1,"pearl-powder":1,"pennyroyal-oil":1,"peptide-secretagogues":1,"phenibut":1,"phenolphthalein":1,"phosphoric-acid":1,"pine-pollen-extract":1,"pinella-ternata":1,"poke-root":1,"pregnenolone":1,"pterocarpus-marsupium":1,"pterostilbene-resveratrol-combo":1,"pyrrolizidine-alkaloid-herbs":1,"rapamycin":1,"raw-adrenal-glandulars":1,"raw-thyroid-glandulars":1,"red-sage-danshen":1,"resveratrol":1,"royal-jelly":1,"sabroxy":1,"sarms":1,"sarsaparilla-root":1,"sassafras-oil":1,"sea-moss":1,"senolytic-stack":1,"serrapeptase":1,"shilajit":1,"shoden-ashwagandha":1,"sibutramine":1,"silver-protein":1,"skullcap":1,"sodium-chlorite":1,"spermidine":1,"stem-cell-supplements":1,"strontium":1,"strychnine":1,"strychnos-nux-vomica":1,"thunder-god-vine":1,"thyroid-glandular-supplements":1,"tianeptine":1,"tiratricol":1,"tocotrienols-annatto-derived":1,"tribulus-terrestris":1,"tung-oil-tree-extract":1,"turkesterone-ecdysteroids":1,"turpentine":1,"usnic-acid":1,"vanadium":1,"vitamin-c-liposomal":1,"vitamin-c-moderate-dose":1,"wheatgrass":1,"white-peony":1,"wild-yam":1,"wormwood-high-dose":1,"yellow-oleander":1,"yohimbe-bark":1,"zeolite":1};
  /* SS_STATIC_SLUGS:end */

  // Prefer the prerendered /supplement/<slug>.html page when one exists.
  // Short slugs (parenthetical stripped) are the sitemap form for many records.
  function supplementPath(key) {
    var slug = String(key == null ? '' : key);
    function hit(s) {
      return s && STATIC_SUPPLEMENT_SLUGS[s] ? '/supplement/' + s + '.html' : '';
    }
    var direct = hit(slug);
    if (direct) return direct;
    var rec = getSupplement(slug);
    if (rec && rec.n) {
      var full = slugify(rec.n);
      var short = slugify(String(rec.n).replace(/\s*\([^)]*\)\s*/g, ' ').trim());
      var viaShort = hit(short);
      if (viaShort) return viaShort;
      var viaFull = hit(full);
      if (viaFull) return viaFull;
    }
    return '/supplement.html?slug=' + encodeURIComponent(slug);
  }

  function urlFor(type, key) {
    var k = encodeURIComponent(key);
    if (type === 'article') {
      var id = String(key == null ? '' : key);
      var man = (typeof window !== 'undefined' && window.__ART_MANIFEST) ? window.__ART_MANIFEST : null;
      if (man && man[id]) return '/a/' + man[id];
      return 'article.html?id=' + encodeURIComponent(id);
    }
    if (type === 'supplement') return supplementPath(key);
    if (type === 'condition')  return 'condition.html?slug='  + k;
    if (type === 'medication') return 'medication.html?slug=' + k;
    if (type === 'biomarker')  return 'biomarker.html?slug='  + k;
    return '#';
  }

  function score(text, q) {
    if (!text || !q) return 0;
    text = String(text).toLowerCase();
    q = String(q).toLowerCase();
    if (text === q) return 100;
    if (text.startsWith(q)) return 80;
    var words = text.split(/[\s/()\-,]+/);
    if (words.some(function (w) { return w.startsWith(q); })) return 60;
    if (text.indexOf(q) >= 0) return 40;
    return 0;
  }

  function combinedScore(parts, q) {
    var tokens = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0;
    var totals = parts.map(function (p) {
      var t = p.text || '';
      var w = p.weight || 1;
      var local = score(t, q) * w;
      var tokSum = tokens.reduce(function (acc, tk) {
        var s = score(t, tk);
        return acc + (s > 0 ? s * 0.5 : 0);
      }, 0);
      return Math.max(local, tokSum * w * 0.4);
    });
    return Math.max.apply(null, totals);
  }

  function search(q, opts) {
    q = String(q == null ? '' : q).trim();
    opts = opts || {};
    var perType = opts.limit || 3;
    var out = { supplements: [], conditions: [], medications: [], biomarkers: [], articles: [] };
    if (q.length < 1) return out;

    // Supplements
    var sBuf = [];
    _S().forEach(function (s, i) {
      var sc = combinedScore([
        { text: s.n,    weight: 1.0 },
        { text: s.tag,  weight: 0.7 },
        { text: s.desc, weight: 0.35 },
        { text: s.dose, weight: 0.25 }
      ], q);
      if (sc > 0) {
        sBuf.push({
          type: 'supplement', slug: slugify(s.n), name: s.n,
          tag: s.tag || '', tier: s.t, idx: i, score: sc, ref: s
        });
      }
    });
    sBuf.sort(function (a, b) { return b.score - a.score; });
    out.supplements = sBuf.slice(0, perType);

    // Conditions
    var cBuf = [];
    var COND = _CONDITIONS();
    Object.keys(COND).forEach(function (k) {
      var c = COND[k];
      var sc = combinedScore([
        { text: c.label, weight: 1.0 },
        { text: k,       weight: 0.6 },
        { text: (c.supps || []).join(' '), weight: 0.25 }
      ], q);
      if (sc > 0) cBuf.push({ type: 'condition', slug: k, name: c.label, score: sc, ref: c });
    });
    cBuf.sort(function (a, b) { return b.score - a.score; });
    out.conditions = cBuf.slice(0, perType);

    // Medications
    var mBuf = [];
    var MED = _MEDS();
    Object.keys(MED).forEach(function (k) {
      var m = MED[k];
      var sc = combinedScore([
        { text: m.label, weight: 1.0 },
        { text: k,       weight: 0.6 },
        { text: m.note,  weight: 0.4 },
        { text: (m.avoid   || []).join(' '), weight: 0.2 },
        { text: (m.caution || []).join(' '), weight: 0.2 }
      ], q);
      if (sc > 0) mBuf.push({ type: 'medication', slug: k, name: m.label, score: sc, ref: m });
    });
    mBuf.sort(function (a, b) { return b.score - a.score; });
    out.medications = mBuf.slice(0, perType);

    // Biomarkers
    var bBuf = [];
    var BIO = _BIOMARKERS();
    Object.keys(BIO).forEach(function (k) {
      var b = BIO[k];
      var sc = combinedScore([
        { text: b.name, weight: 1.0 },
        { text: k,      weight: 0.6 },
        { text: b.desc, weight: 0.4 }
      ], q);
      if (sc > 0) bBuf.push({ type: 'biomarker', slug: k, name: b.name, score: sc, ref: b });
    });
    bBuf.sort(function (a, b) { return b.score - a.score; });
    out.biomarkers = bBuf.slice(0, perType);

    // Articles (titles only)
    var aBuf = [];
    var ART = _ARTICLES_BY_ID();
    Object.keys(ART).forEach(function (id) {
      var a = ART[id]; if (!a) return;
      var sc = combinedScore([
        { text: a.t || '', weight: 1.0 },
        { text: a.c || '', weight: 0.4 }
      ], q);
      if (sc > 0) aBuf.push({ type: 'article', slug: id, id: id, name: a.t, category: a.c, score: sc, ref: a });
    });
    aBuf.sort(function (a, b) { return b.score - a.score; });
    out.articles = aBuf.slice(0, perType);

    return out;
  }

  function _shortName(n) {
    return String(n || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }
  function _nameSlugs(s) {
    return [slugify(s.n), slugify(_shortName(s.n))];
  }
  function _tierRank(tid) {
    return ({ t1: 1, t2: 2, t3: 3, t4: 4 })[tid] || 9;
  }
  function _pickBestSupplement(hits) {
    if (!hits || !hits.length) return null;
    if (hits.length === 1) return hits[0];
    hits = hits.slice().sort(function (a, b) {
      var tr = _tierRank(a.t) - _tierRank(b.t);
      if (tr) return tr;
      return compositeScore(b) - compositeScore(a);
    });
    return hits[0];
  }
  function getSupplement(slug) {
    var t = slugify(slug);
    if (!t) return null;
    var S = _S();
    var EXPLICIT_ALIAS = { 'adenosylcobalamin': 'adenosylcobalamin-dibencozide', 'adenosylcobalamin-active': 'adenosylcobalamin-dibencozide', 'adenosylcobalamin-active-b12-mitochondrial': 'adenosylcobalamin-dibencozide', 'amalaki': 'amla-indian-gooseberry-phyllanthus-emblica', 'amalaki-amla': 'amla-indian-gooseberry-phyllanthus-emblica', 'amalaki-amla-emblica-officinalis-standardised': 'amla-indian-gooseberry-phyllanthus-emblica', 'apricot': 'laetrile-amygdalin-vitamin-b17', 'apricot-kernels': 'laetrile-amygdalin-vitamin-b17', 'apricot-kernels-laetrile': 'laetrile-amygdalin-vitamin-b17', 'apricot-kernels-laetrile-amygdalin': 'laetrile-amygdalin-vitamin-b17', 'astragalus-membranaceus': 'astragalus-astragalus-membranaceus', 'astragalus-membranaceus-huang-qi': 'astragalus-astragalus-membranaceus', 'benfotiamine-fat': 'benfotiamine', 'benfotiamine-fat-soluble-b': 'benfotiamine', 'benfotiamine-fat-soluble-b1': 'benfotiamine', 'bpc-157': 'bpc-157-body-protection-compound', 'bpc-157-oral-pentadecapeptide': 'bpc-157-body-protection-compound', 'butyrate-tributyrin': 'tributyrin-butyrate', 'butyrate-tributyrin-odourless': 'tributyrin-butyrate', 'caprylic-acid-c8': 'caprylic-acid-c8-mct', 'caprylic-acid-c8-targeted-mct': 'caprylic-acid-c8-mct', 'carnosine': 'l-carnosine', 'carnosine-l': 'l-carnosine', 'carnosine-l-carnosine': 'l-carnosine', 'cesium-chloride': 'cesium-chloride-alkaline-therapy', 'cesium-chloride-high-ph-therapy': 'cesium-chloride-alkaline-therapy', 'chasteberry': 'vitex-chasteberry-vitex-agnus-castus', 'chasteberry-vitex': 'vitex-chasteberry-vitex-agnus-castus', 'chasteberry-vitex-standardised': 'vitex-chasteberry-vitex-agnus-castus', 'chasteberry-vitex-standardised-bno': 'vitex-chasteberry-vitex-agnus-castus', 'chasteberry-vitex-standardised-bno-1095': 'vitex-chasteberry-vitex-agnus-castus', 'chlorogenic-acid': 'chlorogenic-acid-green-coffee', 'chlorogenic-acid-green-coffee-extract': 'chlorogenic-acid-green-coffee', 'choline-bitartrate-precursor-cost-effective': 'choline-bitartrate', 'collagen': 'collagen-peptides', 'curcumin-meriva': 'meriva-curcumin-phytosome', 'curcumin-meriva-phytosome': 'meriva-curcumin-phytosome', 'dong-quai': 'dong-quai-angelica-sinensis', 'dong-quai-angelica-sinensis-low-dose': 'dong-quai-angelica-sinensis', 'gamma-oryzanol-rice-bran': 'gamma-oryzanol', 'glynac': 'glynac-glycine-nac', 'glynac-glycine-nac-stack': 'glynac-glycine-nac', 'goji-berry-extract': 'goji-berry-lycium-barbarum', 'goji-berry-extract-lycium-barbarum': 'goji-berry-lycium-barbarum', 'he-shou': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'he-shou-wu': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'he-shou-wu-processed-polygonum-multiflorum': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'ho-shou': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'ho-shou-wu': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'ho-shou-wu-polygonum-multiflorum-fo-ti': 'fo-ti-polygonum-multiflorum-he-shou-wu', 'japanese-knotweed': 'japanese-knotweed-reynoutria-japonica', 'japanese-knotweed-polygonum-cuspidatum': 'japanese-knotweed-reynoutria-japonica', 'jiaogulan': 'jiaogulan-gynostemma', 'jiaogulan-gynostemma-pentaphyllum': 'jiaogulan-gynostemma', 'korean-red-ginseng': 'korean-red-ginseng-panax-ginseng', 'korean-red-ginseng-fermented': 'korean-red-ginseng-panax-ginseng', 'licorice-root-high-dose': 'licorice-root-high-dose-chronic', 'lion-s-mane': 'lion-s-mane-mushroom', 'lion-s-mane-hericium-erinaceus-fruiting-body': 'lion-s-mane-mushroom', 'lions-mane': 'lion-s-mane-mushroom', 'lions-mane-hericium-erinaceus-fruiting-body': 'lion-s-mane-mushroom', 'lycium': 'goji-berry-lycium-barbarum', 'lycium-barbarum': 'goji-berry-lycium-barbarum', 'lycium-barbarum-goji-berry-extract-standardised': 'goji-berry-lycium-barbarum', 'magnesium-bisglycinate': 'magnesium-glycinate', 'methylene-blue': 'methylene-blue-pharmaceutical-grade', 'methylene-blue-oral': 'methylene-blue-pharmaceutical-grade', 'mucuna-pruriens-velvet-bean': 'mucuna-pruriens', 'phosphatidylserine-plant': 'phosphatidylserine', 'phosphatidylserine-plant-derived': 'phosphatidylserine', 'policosanol-cuban': 'policosanol', 'policosanol-cuban-unconfirmed': 'policosanol', 'psyllium-husk': 'psyllium-husk-plantago-ovata', 'psyllium-husk-soluble-fibre': 'psyllium-husk-plantago-ovata', 'red-raspberry': 'raspberry-leaf-rubus-idaeus', 'red-raspberry-leaf': 'raspberry-leaf-rubus-idaeus', 'red-raspberry-leaf-pregnancy-toning': 'raspberry-leaf-rubus-idaeus', 'saccharomyces-boulardii-cncm-i': 'saccharomyces-boulardii', 'saccharomyces-boulardii-cncm-i-745': 'saccharomyces-boulardii', 'schisandra-chinensis': 'schisandra-schisandra-chinensis', 'sodium-bicarbonate': 'sodium-bicarbonate-sports', 'sodium-bicarbonate-exercise-buffer': 'sodium-bicarbonate-sports', 'soursop': 'graviola-annona-muricata', 'soursop-graviola': 'graviola-annona-muricata', 'soursop-graviola-leaf': 'graviola-annona-muricata', 'soursop-graviola-leaf-annona-muricata': 'graviola-annona-muricata', 'sulforaphane': 'sulforaphane-broccoli-sprout-extract', 'sulforaphane-broccoli-isothiocyanate': 'sulforaphane-broccoli-sprout-extract', 'taurine-cardiac': 'taurine', 'taurine-cardiac-and-metabolic': 'taurine', 'tongkat-ali': 'tongkat-ali-eurycoma-longifolia-standardised', 'tongkat-ali-eurycoma-longifolia': 'tongkat-ali-eurycoma-longifolia-standardised', 'tremella-fuciformis-polysaccharide': 'tremella-fuciformis', 'tremella-fuciformis-polysaccharide-beauty-mushroom': 'tremella-fuciformis', 'tremella-fuciformis-snow-fungus': 'tremella-fuciformis', 'tributyrin': 'tributyrin-butyrate', 'tributyrin-gut': 'tributyrin-butyrate', 'tributyrin-gut-barrier-targeted': 'tributyrin-butyrate', 'urolithin-a-mitopure': 'urolithin-a', 'vanadium-ultra': 'vanadium', 'vanadium-ultra-trace': 'vanadium', 'vitamin-b1': 'vitamin-b1-thiamine', 'vitamin-b1-thiamine-clinical': 'vitamin-b1-thiamine' };
    if (EXPLICIT_ALIAS[t]) t = EXPLICIT_ALIAS[t];
    var i, s, pair, full, short;
    // 1. Exact canonical slug — slugify of the full name including parens.
    for (i = 0; i < S.length; i++) {
      if (slugify(S[i].n) === t) return S[i];
    }
    // 2. Short-form slug — strip parenthetical disambiguation, then slugify.
    //    Discover and other curated lists use short names (e.g. "calomel" for
    //    the entry "Calomel (mercurous chloride)"). Falling back here avoids
    //    broken "Supplement not found" pages without forcing every curated
    //    list across the site to use the long canonical slug.
    for (i = 0; i < S.length; i++) {
      if (slugify(_shortName(S[i].n)) === t) return S[i];
    }
    // 3. Hyphen-insensitive unique match (lions-mane ↔ lion-s-mane).
    var compactT = t.replace(/-/g, '');
    var compactHits = [];
    for (i = 0; i < S.length; i++) {
      pair = _nameSlugs(S[i]);
      if (pair[0].replace(/-/g, '') === compactT || pair[1].replace(/-/g, '') === compactT) {
        compactHits.push(S[i]);
      }
    }
    if (compactHits.length === 1) return compactHits[0];

    // 4. Prefix / first-token family (creatine → creatine-monohydrate,
    //    vitamin-d → vitamin-d3). Unique short prefixes are allowed (nmn);
    //    ambiguous families only resolve when every extra token is a form
    //    qualifier (monohydrate / hcl), never a different ingredient (apple-*).
    var GENERIC_HEADING = {
      vitamin: 1, black: 1, white: 1, red: 1, green: 1, blue: 1,
      beta: 1, alpha: 1, gamma: 1, delta: 1, olive: 1, methyl: 1,
      sodium: 1, korean: 1, algal: 1, oil: 1, acid: 1, extract: 1,
      l: 1, d: 1, b: 1, r: 1, s: 1, n: 1, '5': 1, st: 1,
      aged: 1, american: 1, wild: 1, mixed: 1, oral: 1, raw: 1,
      bone: 1, beef: 1, deer: 1, egg: 1, pine: 1, stem: 1,
      soil: 1, spore: 1, cat: 1, apple: 1, bitter: 1, essential: 1,
      modified: 1, partially: 1, dietary: 1, digestive: 1, miracle: 1
    };
    var FORM_TOKEN = {
      monohydrate: 1, hcl: 1, citrate: 1, glycinate: 1, bisglycinate: 1,
      threonate: 1, taurate: 1, malate: 1, orotate: 1, chloride: 1,
      picolinate: 1, gluconate: 1, peptides: 1, extract: 1, oil: 1,
      stack: 1, type: 1, high: 1, low: 1, liquid: 1, gummies: 1,
      complex: 1, blend: 1, form: 1, free: 1, acid: 1, powder: 1,
      root: 1, leaf: 1, seed: 1, bark: 1, standardized: 1, standardised: 1,
      extended: 1, topical: 1, precursors: 1, precursor: 1
    };
    function _isFormFamily(query, hits) {
      return hits.every(function (rec) {
        var sl = slugify(rec.n);
        if (!sl.startsWith(query)) return false;
        var rest = sl.slice(query.length).replace(/^-/, '');
        var tok = (rest.split('-')[0] || '');
        return !tok || FORM_TOKEN[tok] || /^\d/.test(tok);
      });
    }
    var prefixHits = [];
    for (i = 0; i < S.length; i++) {
      s = S[i];
      pair = _nameSlugs(s);
      full = pair[0];
      short = pair[1];
      var matched = false;
      if (full.startsWith(t + '-') || short.startsWith(t + '-')) matched = true;
      else if (
        (full.startsWith(t) && full.length > t.length && /\d/.test(full.charAt(t.length))) ||
        (short.startsWith(t) && short.length > t.length && /\d/.test(short.charAt(t.length)))
      ) matched = true;
      if (matched) prefixHits.push(s);
    }
    if (GENERIC_HEADING[t] || t.length < 3 || /^\d+$/.test(t)) return null;
    if (prefixHits.length === 1) return prefixHits[0];
    if (
      prefixHits.length > 1 &&
      prefixHits.length <= 6 &&
      t.length >= 4 &&
      _isFormFamily(t, prefixHits)
    ) {
      return _pickBestSupplement(prefixHits);
    }
    return null;
  }
  function getCondition(slug)  { return _CONDITIONS()[slug] || null; }
  function getMedication(slug) { return _MEDS()[slug] || null; }
  function getBiomarker(slug)  { return _BIOMARKERS()[slug] || null; }
  function getArticle(id) {
    var A = _ARTICLES_BY_ID();
    return A[id] || A[String(id)] || null;
  }

  // Reverse lookups
  function conditionsForSupplement(name) {
    var C = _CONDITIONS();
    return Object.keys(C).filter(function (k) {
      return (C[k].supps || []).indexOf(name) >= 0;
    }).map(function (k) { return { slug: k, name: C[k].label }; });
  }
  function medsForSupplement(name) {
    var M = _MEDS();
    var hits = [];
    Object.keys(M).forEach(function (k) {
      var m = M[k];
      var bucket = null;
      if      ((m.avoid   || []).indexOf(name) >= 0) bucket = 'avoid';
      else if ((m.caution || []).indexOf(name) >= 0) bucket = 'caution';
      else if ((m.extra   || []).indexOf(name) >= 0) bucket = 'extra';
      if (bucket) hits.push({ slug: k, name: m.label, bucket: bucket });
    });
    return hits;
  }
  function articlesForSupplement(name) {
    return _ARTICLE_MAP()[name] || [];
  }
  function biomarkersForSupplement(name) {
    var B = _BIOMARKERS();
    var hits = [];
    Object.keys(B).forEach(function (k) {
      if ((B[k].supps || []).some(function (x) { return x.name === name; })) {
        hits.push({ slug: k, name: B[k].name });
      }
    });
    return hits;
  }

  function tierMeta(tid) {
    var TM = _TM();
    if (TM && TM[tid]) return TM[tid];
    var fallback = {
      t1: { id: 't1', label: 'Tier 1 — Strong Evidence',         badge: 'Effective' },
      t2: { id: 't2', label: 'Tier 2 — Promising / Situational', badge: 'Promising' },
      t3: { id: 't3', label: 'Tier 3 — Trending',                badge: 'Trending'  },
      t4: { id: 't4', label: 'Tier 4 — Risky / Avoid',           badge: 'Risky'     }
    };
    return fallback[tid] || { id: tid, label: tid, badge: '' };
  }

  function compositeScore(s) {
    if (!s) return 0;
    return (s.e || 0) * 7 + (s.s || 0) * 4 + (s.r || 0) * 3 + (s.o || 0) * 2 + (s.c || 0) * 2 + (s.d || 0) * 2;
  }

  // ARTICLE_MAP is read by article.html for reverse lookups; expose it so
  // callers don't need to repeat the typeof guard.
  function getArticleMap() { return _ARTICLE_MAP(); }

  window.SS = {
    slugify: slugify,
    urlFor: urlFor,
    supplementPath: supplementPath,
    search: search,
    getSupplement: getSupplement,
    getCondition: getCondition,
    getMedication: getMedication,
    getBiomarker: getBiomarker,
    getArticle: getArticle,
    getArticleMap: getArticleMap,
    conditionsForSupplement: conditionsForSupplement,
    medsForSupplement: medsForSupplement,
    articlesForSupplement: articlesForSupplement,
    biomarkersForSupplement: biomarkersForSupplement,
    tierMeta: tierMeta,
    compositeScore: compositeScore
  };
})();
