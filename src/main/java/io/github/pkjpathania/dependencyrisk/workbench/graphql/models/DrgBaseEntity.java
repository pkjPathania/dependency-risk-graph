package io.github.pkjpathania.dependencyrisk.workbench.graphql.models;

import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class DrgBaseEntity {
  private String id;
  private String name;
  private String rdfType;

  @Override
  public String toString() {
    return GenUtil.toJson(this);
  }
}
