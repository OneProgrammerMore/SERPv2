"""
Helper functions for reuse.
"""

import uuid as uuid_pkg


def convert_string_to_uuid(id_str):
    """
    Converts string to uuid
    """
    try:
        uuid = uuid_pkg.UUID(id_str)  # Convert to UUID type
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid UUID format") from exc

    return uuid

convertStringToUUID = convert_string_to_uuid
