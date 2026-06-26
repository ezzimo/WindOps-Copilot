from backend.graph.edges import should_diagnose, should_notify


def test_should_diagnose_true():
    assert should_diagnose({"anomaly_detected": True}) == "diagnose"


def test_should_diagnose_false():
    assert should_diagnose({"anomaly_detected": False}) == "end"


def test_should_diagnose_none():
    assert should_diagnose({"anomaly_detected": None}) == "end"


def test_should_notify_critical():
    assert should_notify({"requires_notification": True}) == "notify"


def test_should_notify_low():
    assert should_notify({"requires_notification": False}) == "end"


def test_should_notify_missing_key():
    assert should_notify({}) == "end"
