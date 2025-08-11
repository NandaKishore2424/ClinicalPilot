const axios = require('axios');
const ReferenceCache = require('../models/ReferenceCache');

// PubMed API base URL
const PUBMED_API_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

exports.findReferences = async (query) => {
  try {
    // Check cache first
    const cachedReferences = await ReferenceCache.findOne({ query });
    if (cachedReferences) {
      console.log('Cache hit for query:', query);
      return cachedReferences.results;
    }
    
    // If not in cache, search PubMed
    const searchResults = await searchPubMed(query);
    
    // Format the results
    const formattedResults = searchResults.map(result => ({
      title: result.title,
      source: 'PubMed',
      link: `https://pubmed.ncbi.nlm.nih.gov/${result.id}/`
    }));
    
    // Cache the results
    if (formattedResults.length > 0) {
      await new ReferenceCache({
        query,
        results: formattedResults
      }).save();
    }
    
    return formattedResults.length > 0 ? formattedResults : getDefaultReference(query);
  } catch (error) {
    console.error('Error finding references:', error);
    return getDefaultReference(query);
  }
};

async function searchPubMed(query) {
  try {
    // Search PubMed
    const searchResponse = await axios.get(`${PUBMED_API_URL}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: `${query} AND review[filter]`,
        retmax: 3,
        retmode: 'json',
        sort: 'relevance'
      }
    });
    
    const idList = searchResponse.data.esearchresult.idlist;
    
    if (idList.length === 0) {
      return [];
    }
    
    // Fetch details for the found IDs
    const summaryResponse = await axios.get(`${PUBMED_API_URL}/esummary.fcgi`, {
      params: {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'json'
      }
    });
    
    // Extract relevant information
    const results = [];
    
    for (const id of idList) {
      const article = summaryResponse.data.result[id];
      
      if (article) {
        results.push({
          id,
          title: article.title,
          authors: article.authors ? article.authors.map(a => a.name).join(', ') : 'Unknown',
          journal: article.fulljournalname || article.source || 'Unknown Journal',
          year: article.pubdate ? article.pubdate.substring(0, 4) : 'Unknown'
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

function getDefaultReference(query) {
  // If we can't find a real reference, provide a general medical resource
  return [{
    title: `Medical information related to ${query}`,
    source: 'MedlinePlus',
    link: `https://medlineplus.gov/ency/encyclopedia.htm`
  }];
}