var assert = require('assert');

//SET THE FOLLOWING TO DESIRED THRESHOLDS
const ACCOUNT_THRESHOLD = 5000000; //30% of 15M account limit
const METRIC_THRESHOLD = 50000; //50% of 100k metric limit

const getAccountLimit = () => {
  return new Promise((resolve, reject) => {
    console.log('Fetching account cardinality...')
    const options = {
      url: 'https://api.newrelic.com/graphql',
      body: JSON.stringify({"query":`{
        actor {
          account(id: ${$env.ACCOUNT_ID}) {
            nrql(query: "SELECT cardinality() FROM Metric WHERE metricName NOT LIKE '%newrelic%' SINCE today WITH TIMEZONE 'UTC' RAW", timeout: 20) {
              results
            }
          }
        }
      }
      `,"variables":null}),
      headers: {
        "api-key": $secure.GRAPHQL_KEY,
        "content-type": "application/json"
      }
    }

    $http.post(options, (err, response, body) => {
      if (err) {
        reject(err)
        return
      }

      assert.equal(response.statusCode, 200, `Expected a 200 OK response, received ${response.statusCode}`);
      const { data } = JSON.parse(body);

      const { nrql } = data.actor.account
      let cardinality = nrql ? nrql.results[0]["cardinality.null"] : 0;
      console.log(`Current Account cardinality: ${cardinality}`)
      resolve(cardinality)

    })
  });
}

const getMetricLimits = () => {
  return new Promise((resolve, reject) => {
    console.log('Fetching metrics cardinality...')
    const options = {
      url: 'https://api.newrelic.com/graphql',
      body: JSON.stringify({"query":`{
        actor {
          account(id: ${$env.ACCOUNT_ID}) {
            nrql(query: "SELECT cardinality() FROM Metric FACET metricName WHERE metricName NOT LIKE '%newrelic%' SINCE today WITH TIMEZONE 'UTC' RAW LIMIT 200", timeout: 30) {
              results
            }
          }
        }
      }
      `,"variables":null}),
      headers: {
        "api-key": $secure.GRAPHQL_KEY,
        "content-type": "application/json"
      }
    }

    $http.post(options, (err, response, body) => {
      if (err) {
        reject(err)
        return
      }

      assert.equal(response.statusCode, 200, `Expected a 200 OK response, received ${response.statusCode}`);
      const { data } = JSON.parse(body);
      const { nrql } = data.actor.account

      let results = nrql ? nrql.results : [];
      resolve(results)

    })
  })
}

const breaches = []

getAccountLimit().then(cardinality => {
  if (cardinality >= ACCOUNT_THRESHOLD) {
    breaches.push(`Account: ${cardinality}`)
  }

  // assert.ok(cardinality < ACCOUNT_THRESHOLD, "Current cardinality has reached threshold")
  getMetricLimits().then(results => {
    if (results && results.length > 0) {

      // Check if each metric has crossed the threshold
      for (const metric of results) {
        if (metric['cardinality.null'] >= METRIC_THRESHOLD) {
          breaches.push(`${metric.metricName}: ${metric['cardinality.null']}`)
        }
      }
    }

    assert.equal(breaches.length, 0, `One or more metrics reached the threshold:\n${breaches.join('\n')}`)
    console.log("No thresholds reached!")
  })
})
