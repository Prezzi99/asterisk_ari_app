DELIMITER $$

CREATE TRIGGER beforeAgentInsert BEFORE INSERT ON agents
	FOR EACH ROW
    BEGIN
		DECLARE count INT DEFAULT (SELECT COUNT(*) FROM agents WHERE user_id = NEW.user_id);
        IF count = 3 THEN
			SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'max_agents_reached';
        END IF;
    END $$