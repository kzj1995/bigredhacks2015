function Lock() {
    return((function() {
        var locked = false;
        var requesters = [];

        function get(cb) {
            if (locked) {
                requesters.push(cb);
                return false;
            } else {
                locked = true;
                return true;
            }
        }

        function free() {
            var cb;
            if (requesters.length == 0) {
                locked = false;
            }

            if (requesters.length > 0) {
                cb = requesters.pop();
                cb();
            }
            return locked;
        }

        return {
            get: get,
            free: free
        }


    })());

}

module.exports = Lock;