# nr-cardinality-checker

### A Scripted API test to check current cardinality both at the account and metrics levels.


## Installation

From root directory, run `npm install` to install node modules.

## Usage

The script is using two types of thresholds:

1. ACCOUNT_THRESHOLD is currently set to 5,000,000
2. METRIC_THRESHOLD is currently set to 50,000

These can be changed to whatever thresholds are needed. When either of these are reached, the script will fail. You can then set up an alert if this monitor fails to get notified when there are any "offending" metrics with high cardinality.

## Running the Script Locally

Add this to the top of your script, the library mimics the Synthetics API and implements most common commands in Synthetics.

```
    if (typeof $env === "undefined" || $env === null) {
      global._isApiTest = true;  // false, for Scripted Browser
      require("./lib/simulator");
    }
```

**NOTE:** Make sure to remove these lines when you copy the script to a Synthetic monitor in the New Relic UI.

Set up the following variables in `lib/simulator.js`:

1. Replace the `ACCOUNT_ID` attribute in the `env` variable with the account ID that you want to check for cardinality.

2. Replace the `GRAPHQL_KEY` attribute in the `secure` variable with a user API key to call NerdGraph.

To run, execute the command `node cardinality_limits.js`. 


If no thresholds are reached, the script will print a line:

```
No thresholds reached!
```

Otherwise, the script will fail with an `AssertionError` showing the account cardinality and/or each metric cardinality that crossed the thresholds.