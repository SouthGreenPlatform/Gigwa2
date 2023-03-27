/**
 * This aggregation query generates a collection named hezCounts in which each document's ID is a heterozigosity frequency found in the database,
 * and the "n" field indicates how many variants have that heterozigosity frequency when calculated using all available samples.
 * The list of samples to account for could be defined explicitly by replacing { "$map" : ... } with something like ["$sp.1.gt", "$sp.1.gt", "$sp.3.gt"]
 * Use with care as this can take several hours to execute on large DBs
 */

db.variantRunData.aggregate([{
  "$project": {
    "f": {
      "$let": {
        "vars": {
          "gt": {
            "$map": {
              "input": {
                "$objectToArray": "$sp"
              },
              "as": "g",
              "in": "$$g.v.gt"
            }
          }
        },
        "in": {
          "$let": {
            "vars": {
              "n": {
                "$size": "$$gt"
              },
              "he": {
                "$size": {
                  "$filter": {
                    "input": "$$gt",
                    "as": "gt",
                    "cond": {
                      "$and": [{
                        "$ne": ["$$gt", null]
                      }, {
                        "$not": {
                          "$regexMatch": {
                            "input": "$$gt",
                            "regex": "^([0-9]+)(\\/\\1)*$"
                          }
                        }
                      }]
                    }
                  }
                }
              }
            },
            "in": {
              "$cond": [{
                "$eq": ["$$n", 0]
              }, 0, {
                "$divide": [{
                  "$multiply": ["$$he", 100]
                }, "$$n"]
              }]
            }
          }
        }
      }
    },
    "_id": "$_id.vi"
  }
}
, {"$group" : {"_id":"$f", "n": {"$sum":{"$toInt":1}}}}
, {"$sort":{"_id":1}}
, {"$out":"hezCounts"}
]);