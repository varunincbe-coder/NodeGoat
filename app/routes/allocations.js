const AllocationsDAO = require("../data/allocations-dao").AllocationsDAO;
const {
    environmentalScripts
} = require("../../config/config");

function AllocationsHandler(db) {
    "use strict";

    const allocationsDAO = new AllocationsDAO(db);

    this.displayAllocations = (req, res, next) => {
        /*
        // Fix for A4 Insecure DOR -  take user id from session instead of from URL param
        const { userId } = req.session;
        */
        const {
            userId
        } = req.params;
        const {
            threshold
        } = req.query;

        // Fix for A1 NoSQL Injection - the threshold must be a whole number between 0 and 99
        if (threshold !== undefined && threshold !== "") {
            if (typeof threshold !== "string" || !/^\d{1,2}$/.test(threshold)) {
                return res.status(400).send("Invalid threshold value");
            }
        }

        allocationsDAO.getByUserIdAndThreshold(userId, threshold, (err, allocations) => {
            if (err) return next(err);
            return res.render("allocations", {
                userId,
                allocations,
                environmentalScripts
            });
        });
    };
}

module.exports = AllocationsHandler;
